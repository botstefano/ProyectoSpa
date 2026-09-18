import { supabase } from '../../../lib/supabaseClient'
import { notificarLeadCalificado, notificarPropuestaAceptada } from '../../../lib/notificaciones'

export async function obtenerLeads() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('contacto')
    .select(`
      id_contacto,
      nombre,
      telefono,
      email,
      fecha_registro,
      estado_contacto (nombre_estado),
      lead_detalle (lead_score),
      descarga (interes)
    `)
    .order('fecha_registro', { ascending: false })

  if (error) {
    console.error('[leadsApi] Error obteniendo leads:', error.message)
    throw error
  }

  const filtrados = data.filter(c => {
    const estadoObj = Array.isArray(c.estado_contacto) ? c.estado_contacto[0] : c.estado_contacto;
    const estado = estadoObj?.nombre_estado;
    return estado === 'buyer' || estado === 'lead';
  });

  return filtrados;
}

/**
 * Transición: BUYER → LEAD
 * Cambia el estado del contacto de 'buyer' a 'lead'
 */
async function transicionarBuyerALead(idContacto) {
  const { data: estado, error: stateError } = await supabase
    .from('estado_contacto')
    .select('id_estado')
    .eq('nombre_estado', 'lead')
    .single()

  if (stateError) throw stateError

  const { error } = await supabase
    .from('contacto')
    .update({ id_estado: estado.id_estado })
    .eq('id_contacto', idContacto)

  if (error) throw error
}

export async function calificarLead(idContacto, score) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { error } = await supabase
    .from('lead_detalle')
    .upsert({ 
      id_contacto: idContacto, 
      lead_score: score, 
      fecha_calificacion: new Date().toISOString() 
    })

  if (error) {
    console.error('[leadsApi] Error al calificar lead:', error.message)
    throw error
  }

  // Si el score es suficiente (>= 50), transicionar automáticamente a LEAD
  if (score >= 50) {
    try {
      await transicionarBuyerALead(idContacto)
      console.log('[leadsApi] Contacto transicionado de BUYER a LEAD')
      // Enviar notificación
      await notificarLeadCalificado(idContacto, score)
    } catch (error) {
      console.error('[leadsApi] Error en transición BUYER → LEAD:', error.message)
      // No bloqueamos el flujo si falla la transición
    }
  }
}

/**
 * Acepta propuesta y prepara para transición a PAYER
 * Esto se llama cuando el lead acepta la propuesta en Fase 2
 */
export async function aceptarPropuesta(idContacto, datosPropuesta) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  // Guardar la propuesta aceptada en lead_detalle
  const { error } = await supabase
    .from('lead_detalle')
    .update({
      propuesta_aceptada: true,
      fecha_aceptacion: new Date().toISOString(),
      datos_propuesta: datosPropuesta
    })
    .eq('id_contacto', idContacto)

  if (error) {
    console.error('[leadsApi] Error al aceptar propuesta:', error.message)
    throw error
  }

  // Enviar notificación a PAYERS
  try {
    await notificarPropuestaAceptada(idContacto, datosPropuesta)
    console.log('[leadsApi] Notificación enviada a PAYERS')
  } catch (notifError) {
    console.error('[leadsApi] Error enviando notificación:', notifError.message)
    // No bloqueamos el flujo si falla la notificación
  }

  return { success: true, message: 'Propuesta aceptada, listo para pasar a PAYERS' }
}