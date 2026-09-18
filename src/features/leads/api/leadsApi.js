import { supabase } from '../../../lib/supabaseClient'

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
      estado_contacto!inner(nombre_estado),
      lead_detalle (
        lead_score,
        fecha_calificacion
      ),
      descarga (
        interes
      )
    `)
    .in('estado_contacto.nombre_estado', ['buyer', 'lead'])
    .order('fecha_registro', { ascending: false })

  if (error) {
    console.error('[leadsApi] Error obteniendo leads:', error.message)
    throw error
  }

  return data
}

export async function calificarLead(idContacto, score) {
  if (!supabase) throw new Error('Supabase no est  configurado.')

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
}