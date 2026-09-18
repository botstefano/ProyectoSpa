import { supabase } from '../../../lib/supabaseClient'

const FUENTE_POR_UTM = {
  instagram: 'Instagram Ads',
  tiktok: 'TikTok Ads',
  convenio: 'Convenio',
}

/** Resuelve la fuente de captación a partir de ?utm_source= en la URL. */
function resolverNombreFuente() {
  const utm = new URLSearchParams(window.location.search).get('utm_source')
  return FUENTE_POR_UTM[utm?.toLowerCase()] ?? 'Orgánico'
}

async function idPorNombre(tabla, columnaId, columnaNombre, nombre) {
  const { data, error } = await supabase
    .from(tabla)
    .select(columnaId)
    .eq(columnaNombre, nombre)
    .limit(1)
    .single()

  if (error) throw error
  return data[columnaId]
}

/**
 * Registra una visita anónima a la landing (VisitaLanding, convirtio = false).
 * Se llama una vez al cargar la página. Devuelve el id_visita para
 * poder marcarla como convertida más adelante si el visitante llena el formulario.
 */
export async function registrarVisita() {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('visitalanding')
    .insert({ convirtio: false })
    .select('id_visita')
    .single()

  if (error) {
    // No bloqueamos la experiencia del usuario si falla el tracking.
    console.error('[buyersApi] No se pudo registrar la visita:', error.message)
    return null
  }
  return data.id_visita
}

/**
 * Flujo completo de conversión buyer → contacto registrado:
 * 1) resuelve id_fuente e id_estado ('buyer')
 * 2) crea el registro en Contacto
 * 3) registra la descarga del lead magnet con el perfil capturado
 * 4) marca la visita original como convertida
 */
export async function registrarLead({ nombre, email, telefono, tipoPiel, interes, idVisita }) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. La landing está en modo demo.')
  }

  const [idFuente, idEstadoBuyer, idLeadMagnet] = await Promise.all([
    idPorNombre('fuente_captacion', 'id_fuente', 'nombre', resolverNombreFuente()),
    idPorNombre('estado_contacto', 'id_estado', 'nombre_estado', 'buyer'),
    idPorNombre('leadmagnet', 'id_lead_magnet', 'nombre', 'Rutina de cuidado facial según tu tipo de piel'),
  ])

  const { data: contacto, error: errorContacto } = await supabase
    .from('contacto')
    .insert({
      nombre,
      email,
      telefono,
      id_fuente: idFuente,
      id_estado: idEstadoBuyer,
    })
    .select('id_contacto')
    .single()

  if (errorContacto) throw errorContacto

  const { error: errorDescarga } = await supabase.from('descarga').insert({
    id_contacto: contacto.id_contacto,
    id_lead_magnet: idLeadMagnet,
    tipo_piel: tipoPiel,
    interes,
  })
  if (errorDescarga) throw errorDescarga

  if (idVisita) {
    const { error: errorVisita } = await supabase
      .from('visitalanding')
      .update({ id_contacto: contacto.id_contacto, convirtio: true })
      .eq('id_visita', idVisita)
    if (errorVisita) {
      // No es crítico para el usuario final: el contacto ya quedó registrado.
      console.error('[buyersApi] No se pudo actualizar la visita:', errorVisita.message)
    }
  }

  return contacto.id_contacto
}
