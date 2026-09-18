import { supabase } from '../../../lib/supabaseClient'
import { notificarPagoConfirmado, notificarPagoRechazado } from '../../../lib/notificaciones'

/**
 * Obtiene leads que ya fueron calificados y están listos para pasar a PAYERS
 * Filtra por estado 'lead' y que tengan lead_score >= umbral
 */
export async function obtenerLeadsParaPago() {
  if (!supabase) return []

  const { data, error } = await supabase
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
        fecha_calificacion
      ),
      descarga (
        interes
      )
    `)
    .eq('estado_contacto.nombre_estado', 'lead')
    .order('fecha_registro', { ascending: false })

  if (error) {
    console.error('[payersApi] Error obteniendo leads para pago:', error.message)
    throw error
  }

  // Filtrar solo leads con score suficiente (ej: >= 50)
  return data.filter(lead => {
    const score = lead.lead_detalle?.[0]?.lead_score || 0
    return score >= 50
  })
}

/**
 * Crea un cronograma de pagos para un servicio
 */
export async function crearCronogramaPagos(idContacto, servicio, precioTotal, cuotas = 3) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const montoCuota = Math.round(precioTotal / cuotas)
  const fechaInicio = new Date()
  const pagos = []

  for (let i = 0; i < cuotas; i++) {
    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setDate(fechaInicio.getDate() + (i * 15)) // Cada 15 días

    pagos.push({
      id_contacto: idContacto,
      concepto: i === 0 ? 'Pago inicial' : `Cuota ${i + 1}`,
      monto: i === cuotas - 1 ? precioTotal - (montoCuota * (cuotas - 1)) : montoCuota,
      fecha_vencimiento: fechaVencimiento.toISOString(),
      estado: 'pendiente'
    })
  }

  return pagos
}

/**
 * Registra un pago en la base de datos
 */
export async function registrarPago(idContacto, pago) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
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

  if (error) {
    console.error('[payersApi] Error registrando pago:', error.message)
    throw error
  }

  return data
}

/**
 * Actualiza el estado de un pago
 */
export async function actualizarEstadoPago(idContacto, nuevoEstado) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { error } = await supabase
    .from('pago_detalle')
    .update({ estado_pago: nuevoEstado })
    .eq('id_contacto', idContacto)

  if (error) {
    console.error('[payersApi] Error actualizando estado de pago:', error.message)
    throw error
  }
}

/**
 * Transición: LEAD → PAYER
 * Cambia el estado del contacto a 'payer' cuando se confirma el primer pago
 */
async function transicionarLeadAPayer(idContacto) {
  const { data: estado, error: stateError } = await supabase
    .from('estado_contacto')
    .select('id_estado')
    .eq('nombre_estado', 'payer')
    .single()

  if (stateError) throw stateError

  const { error } = await supabase
    .from('contacto')
    .update({ id_estado: estado.id_estado })
    .eq('id_contacto', idContacto)

  if (error) throw error
}

/**
 * Procesa un pago completo: registra pago y transiciona estado
 */
export async function procesarPagoCompleto(idContacto, datosPago) {
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

  return { success: true, message: 'Pago procesado y estado actualizado' }
}

/**
 * Obtiene detalles de pago de un contacto
 */
export async function obtenerDetallesPago(idContacto) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('pago_detalle')
    .select('*')
    .eq('id_contacto', idContacto)
    .single()

  if (error) {
    console.error('[payersApi] Error obteniendo detalles de pago:', error.message)
    return null
  }

  return data
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
