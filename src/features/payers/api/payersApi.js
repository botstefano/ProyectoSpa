import { supabase, requireSupabase, safeSupabaseOperation } from '../../../lib/supabaseClient'
import { notificarPagoConfirmado, notificarPagoRechazado } from '../../../lib/notificaciones'
import { validateAmount } from '../../../lib/validators'
import { handleSupabaseError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'

/**
 * Obtiene leads que ya fueron calificados y están listos para pasar a PAYERS
 * Filtra por estado 'lead', lead_score >= umbral y propuesta_aceptada = true
 */
export async function obtenerLeadsParaPago() {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('contacto')
        .select(`
          id_contacto,
          nombre,
          telefono,
          email,
          fecha_registro,
          estado_contacto!inner(nombre_estado),
          lead_detalle (
            lead_score,
            fecha_calificacion,
            propuesta_aceptada,
            fecha_aceptacion,
            datos_propuesta
          ),
          descarga (
            interes
          )
        `)
        .eq('estado_contacto.nombre_estado', 'lead')
        .order('fecha_registro', { ascending: false })

      if (error) throw handleSupabaseError(error, 'obtener leads para pago')

      // Filtrar solo leads con score suficiente Y propuesta aceptada
      const filtrados = data.filter(lead => {
        const score = lead.lead_detalle?.[0]?.lead_score || 0
        const propuestaAceptada = lead.lead_detalle?.[0]?.propuesta_aceptada || false
        
        return score >= 50 && propuestaAceptada
      })

      logger.info('payersApi', `Leads para pago obtenidos: ${filtrados.length}`)
      return filtrados
    } catch (error) {
      logger.error('payersApi', 'Error obteniendo leads para pago', { error })
      throw error
    }
  }, [])
}

/**
 * Crea un cronograma de pagos para un servicio
 */
export async function crearCronogramaPagos(idContacto, servicio, precioTotal, cuotas = 3) {
  try {
    // Validar monto total
    const amountValidation = validateAmount(precioTotal, 10, 100000)
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error)
    }

    const montoCuota = Math.round(amountValidation.cleanAmount / cuotas)
    const fechaInicio = new Date()
    const pagos = []

    for (let i = 0; i < cuotas; i++) {
      const fechaVencimiento = new Date(fechaInicio)
      fechaVencimiento.setDate(fechaInicio.getDate() + (i * 15)) // Cada 15 días

      pagos.push({
        id_contacto: idContacto,
        concepto: i === 0 ? 'Pago inicial' : `Cuota ${i + 1}`,
        monto: i === cuotas - 1 ? amountValidation.cleanAmount - (montoCuota * (cuotas - 1)) : montoCuota,
        fecha_vencimiento: fechaVencimiento.toISOString(),
        estado: 'pendiente'
      })
    }

    logger.info('payersApi', `Cronograma creado para contacto ${idContacto}`, { cuotas, total: amountValidation.cleanAmount })
    return pagos
  } catch (error) {
    logger.error('payersApi', 'Error creando cronograma', { idContacto, error })
    throw error
  }
}

/**
 * Registra un pago en la base de datos
 */
export async function registrarPago(idContacto, pago) {
  try {
    const client = requireSupabase()

    // Validar monto del pago
    if (pago.monto_total !== undefined) {
      const amountValidation = validateAmount(pago.monto_total)
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error)
      }
      pago.monto_total = amountValidation.cleanAmount
    }

    const { data, error } = await client
      .from('pago_detalle')
      .upsert({
        id_contacto: idContacto,
        estado_pago: pago.estado || 'pendiente',
        fecha_pago: pago.fecha_pago || new Date().toISOString(),
        servicio_contratado: pago.servicio_contratado || 'Servicio general',
        monto_total: pago.monto_total || 0,
        metodo_pago: pago.metodo_pago || 'efectivo'
      })
      .select()
      .single()

    if (error) throw handleSupabaseError(error, 'registrar pago')

    logger.info('payersApi', `Pago registrado para contacto ${idContacto}`, { monto: pago.monto_total })
    return data
  } catch (error) {
    logger.error('payersApi', 'Error registrando pago', { idContacto, error })
    throw error
  }
}

/**
 * Actualiza el estado de un pago
 */
export async function actualizarEstadoPago(idContacto, nuevoEstado) {
  try {
    const client = requireSupabase()

    const { error } = await client
      .from('pago_detalle')
      .update({ estado_pago: nuevoEstado })
      .eq('id_contacto', idContacto)

    if (error) throw handleSupabaseError(error, 'actualizar estado de pago')

    logger.info('payersApi', `Estado de pago actualizado para contacto ${idContacto}`, { nuevoEstado })
  } catch (error) {
    logger.error('payersApi', 'Error actualizando estado de pago', { idContacto, error })
    throw error
  }
}

/**
 * Transición: LEAD → PAYER
 * Cambia el estado del contacto a 'payer' cuando se confirma el primer pago
 */
async function transicionarLeadAPayer(idContacto) {
  try {
    const client = requireSupabase()
    const { data: estado, error: stateError } = await client
      .from('estado_contacto')
      .select('id_estado')
      .eq('nombre_estado', 'payer')
      .single()

    if (stateError) throw handleSupabaseError(stateError, 'obtener estado payer')

    const { error } = await client
      .from('contacto')
      .update({ id_estado: estado.id_estado })
      .eq('id_contacto', idContacto)

    if (error) throw handleSupabaseError(error, 'transicionar a payer')

    logger.info('payersApi', `Contacto ${idContacto} transicionado a PAYER`)
  } catch (error) {
    logger.error('payersApi', 'Error en transición LEAD → PAYER', { idContacto, error })
    throw error
  }
}

/**
 * Procesa un pago completo: registra pago y transiciona estado
 */
export async function procesarPagoCompleto(idContacto, datosPago) {
  try {
    // Registrar el pago
    await registrarPago(idContacto, datosPago)

    // Si el pago está confirmado, transicionar a PAYER
    if (datosPago.estado === 'confirmado' || datosPago.estado === 'pagado') {
      await transicionarLeadAPayer(idContacto)
      // Enviar notificación a CUSTOMERS
      await notificarPagoConfirmado(idContacto, datosPago)
    } else if (datosPago.estado === 'rechazado') {
      // Enviar notificación a LEADS para seguimiento
      await notificarPagoRechazado(idContacto, datosPago.motivo || 'Motivo no especificado')
    }

    return createResponse(true, { message: 'Pago procesado y estado actualizado' })
  } catch (error) {
    logger.error('payersApi', 'Error procesando pago completo', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al procesar pago',
      code: error.code || 'PAYMENT_PROCESSING_ERROR'
    })
  }
}

/**
 * Obtiene detalles de pago de un contacto
 */
export async function obtenerDetallesPago(idContacto) {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('pago_detalle')
        .select('*')
        .eq('id_contacto', idContacto)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error, 'obtener detalles de pago')
      }

      return data
    } catch (error) {
      logger.error('payersApi', 'Error obteniendo detalles de pago', { idContacto, error })
      return null
    }
  }, null)
}

/**
 * Verifica si un contacto tiene pago confirmado
 */
export async function verificarPagoConfirmado(idContacto) {
  const pago = await obtenerDetallesPago(idContacto)
  if (!pago) return false

  const estadoNormalizado = pago.estado_pago?.toLowerCase().trim()
  return estadoNormalizado === 'confirmado' ||
         estadoNormalizado === 'pagado' ||
         estadoNormalizado === 'pago confirmado'
}
