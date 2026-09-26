import { supabase, requireSupabase, safeSupabaseOperation } from '../../../lib/supabaseClient'
import { enviarEmailPago } from '../../../lib/emailService'
import { notificarPagoClienteCompletado } from '../../../lib/notificaciones'
import { handleSupabaseError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'
import { procesarPagoCompleto } from './payersApi'

/**
 * Genera un token único para pago
 */
function generarTokenPago() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `PAGO-${timestamp}-${random}`.toUpperCase()
}

/**
 * Valida formato de token de pago
 */
function validarTokenPago(token) {
  if (!token || typeof token !== 'string') return false
  return token.startsWith('PAGO-') && token.length >= 20
}

/**
 * Crea un pago simulado para un contacto
 */
export async function crearPagoSimulado(idContacto, datosPago) {
  try {
    const client = requireSupabase()

    // Validar datos requeridos
    if (!datosPago.monto_total || !datosPago.servicio_contratado) {
      throw new Error('Monto y servicio son requeridos')
    }

    // Generar token único
    const token = generarTokenPago()

    // Calcular fecha de expiración (7 días)
    const expiraEn = new Date()
    expiraEn.setDate(expiraEn.getDate() + 7)

    // Insertar pago simulado
    const { data, error } = await client
      .from('pago_simulado')
      .insert({
        id_contacto: idContacto,
        token_pago: token,
        monto_total: datosPago.monto_total,
        servicio_contratado: datosPago.servicio_contratado,
        tipo_comprobante: datosPago.tipo_comprobante || 'boleta',
        expira_en: expiraEn.toISOString()
      })
      .select('token_pago, id_pago_simulado')
      .single()

    if (error) throw handleSupabaseError(error, 'crear pago simulado')

    logger.info('pagoSimuladoApi', 'Pago simulado creado', { 
      idContacto, 
      token, 
      monto: datosPago.monto_total 
    })

    return createResponse(true, { 
      token: data.token_pago, 
      idPagoSimulado: data.id_pago_simulado 
    })
  } catch (error) {
    logger.error('pagoSimuladoApi', 'Error creando pago simulado', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al crear pago simulado',
      code: error.code || 'PAGO_SIMULADO_ERROR'
    })
  }
}

/**
 * Envía email de pago a un cliente
 */
export async function enviarEmailPagoSimulado(idContacto, emailCliente, nombreCliente, datosPago) {
  try {
    // Primero crear el pago simulado
    const pagoResult = await crearPagoSimulado(idContacto, datosPago)
    
    if (!pagoResult.success) {
      return pagoResult
    }

    const token = pagoResult.data.token
    const origen = window.location.origin

    // Enviar email usando el servicio de email
    const emailResult = await enviarEmailPago(
      emailCliente,
      nombreCliente,
      token,
      origen,
      datosPago
    )

    if (!emailResult.success) {
      logger.warn('pagoSimuladoApi', 'Email no enviado, pero pago creado', { 
        idContacto, 
        email: emailResult 
      })
      return createResponse(true, {
        token: token,
        emailEnviado: false,
        mensaje: 'Pago creado pero email no enviado (revisar configuración RESEND)',
        linkManual: `${origen}/pago/${token}`
      })
    }

    logger.info('pagoSimuladoApi', 'Email de pago enviado exitosamente', { 
      idContacto, 
      email: emailCliente 
    })

    return createResponse(true, {
      token: token,
      emailEnviado: true,
      mensaje: 'Email de pago enviado exitosamente'
    })
  } catch (error) {
    logger.error('pagoSimuladoApi', 'Error enviando email de pago', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al enviar email de pago',
      code: error.code || 'EMAIL_ERROR'
    })
  }
}

/**
 * Obtiene datos de un pago por token
 */
export async function obtenerPagoPorToken(token) {
  return safeSupabaseOperation(async (client) => {
    try {
      // Validar formato del token
      if (!validarTokenPago(token)) {
        throw new Error('Token inválido')
      }

      const { data, error } = await client
        .from('pago_simulado')
        .select(`
          id_pago_simulado,
          id_contacto,
          monto_total,
          servicio_contratado,
          estado_pago,
          tipo_comprobante,
          fecha_envio,
          expira_en,
          contacto (nombre, email, telefono)
        `)
        .eq('token_pago', token)
        .maybeSingle()

      if (error) throw handleSupabaseError(error, 'obtener pago por token')
      if (!data) throw new Error('Enlace de pago no encontrado o inválido')

      // Verificar si ha expirado
      if (new Date(data.expira_en) < new Date()) {
        throw new Error('El enlace de pago ha expirado')
      }

      // Verificar si ya fue completado
      if (data.estado_pago === 'completado') {
        throw new Error('Este pago ya fue completado')
      }

      if (data.estado_pago === 'cancelado') {
        throw new Error('Este pago fue cancelado')
      }

      return data
    } catch (error) {
      logger.error('pagoSimuladoApi', 'Error obteniendo pago por token', { token, error })
      throw error
    }
  }, null)
}

/**
 * Completa un pago simulado
 */
export async function completarPagoSimulado(token, datosFormulario) {
  try {
    const client = requireSupabase()

    // Primero obtener el pago para validar
    const pago = await obtenerPagoPorToken(token)
    if (!pago) {
      throw new Error('Pago no encontrado o inválido')
    }

    // Actualizar el pago como completado
    const { error: updateError } = await client
      .from('pago_simulado')
      .update({
        estado_pago: 'completado',
        metodo_pago_elegido: datosFormulario.metodo_pago,
        datos_pago: datosFormulario,
        fecha_completado: new Date().toISOString()
      })
      .eq('token_pago', token)

    if (updateError) throw handleSupabaseError(updateError, 'completar pago simulado')

    // Procesar el pago en el sistema principal (transición a PAYER)
    const datosPagoPrincipal = {
      estado_pago: 'confirmado',
      fecha_pago: new Date().toISOString(),
      servicio_contratado: pago.servicio_contratado,
      monto_total: pago.monto_total,
      metodo_pago: datosFormulario.metodo_pago
    }

    await procesarPagoCompleto(pago.id_contacto, datosPagoPrincipal)

    // Enviar notificación al staff de PAYERS
    try {
      await notificarPagoClienteCompletado(pago.id_contacto, {
        monto: pago.monto_total,
        servicio: pago.servicio_contratado,
        metodo: datosFormulario.metodo_pago,
        cliente: pago.contacto.nombre
      })
      logger.info('pagoSimuladoApi', 'Notificación enviada al staff', { idContacto: pago.id_contacto })
    } catch (notifError) {
      logger.warn('pagoSimuladoApi', 'Error enviando notificación al staff', { error: notifError })
      // No bloqueamos el flujo si falla la notificación
    }

    logger.info('pagoSimuladoApi', 'Pago simulado completado exitosamente', { 
      token, 
      idContacto: pago.id_contacto 
    })

    return createResponse(true, { 
      message: 'Pago completado exitosamente',
      numeroComprobante: await generarNumeroComprobante(pago.id_pago_simulado)
    })
  } catch (error) {
    logger.error('pagoSimuladoApi', 'Error completando pago simulado', { token, error })
    return createResponse(false, null, {
      message: error.message || 'Error al completar pago',
      code: error.code || 'COMPLETAR_PAGO_ERROR'
    })
  }
}

/**
 * Genera número de comprobante
 */
async function generarNumeroComprobante(idPagoSimulado) {
  try {
    const client = requireSupabase()
    
    const { data, error } = await client
      .from('pago_simulado')
      .select('numero_comprobante')
      .eq('id_pago_simulado', idPagoSimulado)
      .single()

    if (error) throw error

    return data?.numero_comprobante || 'PENDIENTE'
  } catch (error) {
    logger.error('pagoSimuladoApi', 'Error generando número de comprobante', { error })
    return 'PENDIENTE'
  }
}

/**
 * Obtiene el comprobante de un pago
 */
export async function obtenerComprobantePago(token) {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('pago_simulado')
        .select(`
          id_pago_simulado,
          numero_comprobante,
          tipo_comprobante,
          fecha_completado,
          monto_total,
          servicio_contratado,
          metodo_pago_elegido,
          datos_pago,
          contacto (nombre, email, telefono)
        `)
        .eq('token_pago', token)
        .eq('estado_pago', 'completado')
        .maybeSingle()

      if (error) throw handleSupabaseError(error, 'obtener comprobante')

      if (!data) {
        throw new Error('Comprobante no encontrado. El pago debe estar completado.')
      }

      return data
    } catch (error) {
      logger.error('pagoSimuladoApi', 'Error obteniendo comprobante', { token, error })
      throw error
    }
  }, null)
}

/**
 * Obtiene pagos simulados de un contacto
 */
export async function obtenerPagosContacto(idContacto) {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('pago_simulado')
        .select('*')
        .eq('id_contacto', idContacto)
        .order('fecha_envio', { ascending: false })

      if (error) throw handleSupabaseError(error, 'obtener pagos contacto')

      return data
    } catch (error) {
      logger.error('pagoSimuladoApi', 'Error obteniendo pagos contacto', { idContacto, error })
      return []
    }
  }, [])
}

/**
 * Cancela un pago simulado
 */
export async function cancelarPagoSimulado(idPagoSimulado) {
  try {
    const client = requireSupabase()

    const { error } = await client
      .from('pago_simulado')
      .update({ estado_pago: 'cancelado' })
      .eq('id_pago_simulado', idPagoSimulado)

    if (error) throw handleSupabaseError(error, 'cancelar pago simulado')

    logger.info('pagoSimuladoApi', 'Pago simulado cancelado', { idPagoSimulado })
    return createResponse(true, { message: 'Pago cancelado exitosamente' })
  } catch (error) {
    logger.error('pagoSimuladoApi', 'Error cancelando pago simulado', { idPagoSimulado, error })
    return createResponse(false, null, {
      message: error.message || 'Error al cancelar pago',
      code: error.code || 'CANCELAR_PAGO_ERROR'
    })
  }
}

export default {
  crearPagoSimulado,
  enviarEmailPagoSimulado,
  obtenerPagoPorToken,
  completarPagoSimulado,
  obtenerComprobantePago,
  obtenerPagosContacto,
  cancelarPagoSimulado
}