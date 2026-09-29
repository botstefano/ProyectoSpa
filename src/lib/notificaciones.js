import { supabase, isSupabaseConfigured, isNetworkOrFetchError } from './supabaseClient'

/**
 * Sistema de notificaciones entre fases del proceso IMPULSE
 * Permite que las fases se comuniquen automáticamente cuando ocurren eventos importantes
 */

/**
 * Envía una notificación de una fase a otra
 * @param {number} idContacto - ID del contacto
 * @param {string} faseOrigen - Fase que envía la notificación ('buyers', 'leads', 'payers', 'customers')
 * @param {string} faseDestino - Fase que debe recibir la notificación
 * @param {string} tipoEvento - Tipo de evento (ej: 'lead_calificado', 'propuesta_aceptada', 'pago_confirmado')
 * @param {string} mensaje - Mensaje descriptivo
 * @param {object} dataAdicional - Datos adicionales en formato JSON
 */
export async function enviarNotificacion(idContacto, faseOrigen, faseDestino, tipoEvento, mensaje, dataAdicional = {}) {
  if (!supabase || !isSupabaseConfigured) {
    return { success: true, message: 'Notificación procesada localmente' }
  }

  try {
    const { error } = await supabase
      .from('notificacion_fase')
      .insert({
        id_contacto: idContacto,
        fase_origen: faseOrigen,
        fase_destino: faseDestino,
        tipo_evento: tipoEvento,
        mensaje: mensaje,
        data_adicional: dataAdicional
      })

    if (error) {
      if (isNetworkOrFetchError(error)) {
        return { success: false, message: 'Sin conexión con base de datos' }
      }
      throw error
    }

    console.log(`[Notificaciones] ${faseOrigen} → ${faseDestino}: ${tipoEvento}`)
    return { success: true, message: 'Notificación enviada' }
  } catch (error) {
    if (isNetworkOrFetchError(error)) {
      return { success: false, message: 'Sin conexión con base de datos' }
    }
    console.warn('[Notificaciones] Aviso enviando notificación:', error?.message || error)
    return { success: false, message: error?.message || 'Error al enviar notificación' }
  }
}

/**
 * Obtiene notificaciones pendientes para una fase específica
 * @param {string} fase - Fase que quiere recibir notificaciones
 * @returns {Array} Lista de notificaciones no leídas
 */
export async function obtenerNotificacionesPendientes(fase) {
  if (!supabase || !isSupabaseConfigured) return []

  try {
    const { data, error } = await supabase
      .from('notificacion_fase')
      .select('*')
      .eq('fase_destino', fase)
      .eq('leida', false)
      .order('fecha_creacion', { ascending: false })

    if (error) {
      if (isNetworkOrFetchError(error)) {
        return []
      }
      console.warn('[Notificaciones] Aviso obteniendo notificaciones:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    if (isNetworkOrFetchError(error)) {
      return []
    }
    console.warn('[Notificaciones] Aviso obteniendo notificaciones:', error?.message || error)
    return []
  }
}

/**
 * Marca una notificación como leída
 * @param {number} idNotificacion - ID de la notificación
 */
export async function marcarNotificacionLeida(idNotificacion) {
  if (!supabase || !isSupabaseConfigured) return

  try {
    const { error } = await supabase
      .from('notificacion_fase')
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq('id_notificacion', idNotificacion)

    if (error && !isNetworkOrFetchError(error)) {
      console.warn('[Notificaciones] Aviso marcando notificación como leída:', error.message)
    }
  } catch (error) {
    if (!isNetworkOrFetchError(error)) {
      console.warn('[Notificaciones] Aviso marcando notificación como leída:', error?.message || error)
    }
  }
}

/**
 * Notificaciones específicas para cada transición de fase
 */

// BUYER → LEAD: Cuando se califica un lead con score >= 50
export async function notificarLeadCalificado(idContacto, score) {
  return enviarNotificacion(
    idContacto,
    'leads',
    'leads',
    'lead_calificado',
    `Lead calificado con score ${score}/100. Listo para propuesta.`,
    { score: score, fecha_calificacion: new Date().toISOString() }
  )
}

// LEAD → PAYER: Cuando se acepta una propuesta
export async function notificarPropuestaAceptada(idContacto, datosPropuesta) {
  return enviarNotificacion(
    idContacto,
    'leads',
    'payers',
    'propuesta_aceptada',
    'Propuesta aceptada. Lead listo para proceso de pago.',
    datosPropuesta
  )
}

// PAYER → CUSTOMERS: Cuando se confirma un pago
export async function notificarPagoConfirmado(idContacto, datosPago) {
  return enviarNotificacion(
    idContacto,
    'payers',
    'customers',
    'pago_confirmado',
    'Pago confirmado. Servicio activado para atención.',
    datosPago
  )
}

// CLIENTE → PAYERS: Cuando el cliente completa el pago simulado
export async function notificarPagoClienteCompletado(idContacto, datosPago) {
  return enviarNotificacion(
    idContacto,
    'payers',
    'payers',
    'pago_cliente_completado',
    'El cliente ha completado el pago simulado. Revisar y confirmar.',
    datosPago
  )
}

// PAYER → LEAD: Cuando un pago es rechazado
export async function notificarPagoRechazado(idContacto, motivo) {
  return enviarNotificacion(
    idContacto,
    'payers',
    'leads',
    'pago_rechazado',
    `Pago rechazado: ${motivo}. Requiere seguimiento.`,
    { motivo: motivo, fecha: new Date().toISOString() }
  )
}

// CUSTOMERS → PAYERS: Cuando un cliente no asiste
export async function notificarNoAsistencia(idContacto, detalles) {
  return enviarNotificacion(
    idContacto,
    'customers',
    'payers',
    'no_asistencia',
    'Cliente no asistió a la cita programada.',
    detalles
  )
}
