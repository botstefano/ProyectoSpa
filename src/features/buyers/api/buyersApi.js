import { supabase, requireSupabase, safeSupabaseOperation } from '../../../lib/supabaseClient'
import { validateEmail, validatePhone, validateName, validateContact } from '../../../lib/validators'
import { handleSupabaseError, handleValidationError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'

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
  try {
    const client = requireSupabase()
    const { data, error } = await client
      .from(tabla)
      .select(columnaId)
      .eq(columnaNombre, nombre)
      .limit(1)
      .single()

    if (error) throw handleSupabaseError(error, `obtener ID de ${tabla}`)
    return data[columnaId]
  } catch (error) {
    logger.error('buyersApi', `Error obteniendo ID de ${tabla}`, { tabla, nombre, error })
    throw error
  }
}

/**
 * Registra una visita anónima a la landing (VisitaLanding, convirtio = false).
 * Se llama una vez al cargar la página. Devuelve el id_visita para
 * poder marcarla como convertida más adelante si el visitante llena el formulario.
 */
export async function registrarVisita() {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('visitalanding')
        .insert({ convirtio: false })
        .select('id_visita')
        .single()

      if (error) throw handleSupabaseError(error, 'registrar visita')
      
      logger.info('buyersApi', 'Visita registrada exitosamente', { idVisita: data.id_visita })
      return data.id_visita
    } catch (error) {
      // No bloqueamos la experiencia del usuario si falla el tracking.
      logger.warn('buyersApi', 'No se pudo registrar la visita', { error })
      return null
    }
  }, null)
}

/**
 * Flujo completo de conversión buyer → contacto registrado:
 * 1) valida los datos del contacto
 * 2) resuelve id_fuente e id_estado ('buyer')
 * 3) crea el registro en Contacto
 * 4) registra la descarga del lead magnet con el perfil capturado
 * 5) marca la visita original como convertida
 */
export async function registrarLead({ nombre, email, telefono, tipoPiel, interes, idVisita }) {
  try {
    // Validar datos del contacto
    const nombreValidation = validateName(nombre)
    if (!nombreValidation.valid) {
      throw handleValidationError('nombre', nombreValidation.error, nombre)
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      throw handleValidationError('email', emailValidation.error, email)
    }

    const phoneValidation = validatePhone(telefono)
    if (!phoneValidation.valid) {
      throw handleValidationError('telefono', phoneValidation.error, telefono)
    }

    const client = requireSupabase()

    const [idFuente, idEstadoBuyer, idLeadMagnet] = await Promise.all([
      idPorNombre('fuente_captacion', 'id_fuente', 'nombre', resolverNombreFuente()),
      idPorNombre('estado_contacto', 'id_estado', 'nombre_estado', 'buyer'),
      idPorNombre('leadmagnet', 'id_lead_magnet', 'nombre', 'Rutina de cuidado facial según tu tipo de piel'),
    ])

    const { data: contacto, error: errorContacto } = await client
      .from('contacto')
      .insert({
        nombre: nombreValidation.cleanName,
        email: email,
        telefono: phoneValidation.cleanPhone,
        id_fuente: idFuente,
        id_estado: idEstadoBuyer,
      })
      .select('id_contacto')
      .single()

    if (errorContacto) throw handleSupabaseError(errorContacto, 'crear contacto')

    const { error: errorDescarga } = await client.from('descarga').insert({
      id_contacto: contacto.id_contacto,
      id_lead_magnet: idLeadMagnet,
      tipo_piel: tipoPiel,
      interes,
    })
    
    if (errorDescarga) throw handleSupabaseError(errorDescarga, 'registrar descarga')

    if (idVisita) {
      const { error: errorVisita } = await client
        .from('visitalanding')
        .update({ id_contacto: contacto.id_contacto, convirtio: true })
        .eq('id_visita', idVisita)
      
      if (errorVisita) {
        // No es crítico para el usuario final: el contacto ya quedó registrado.
        logger.warn('buyersApi', 'No se pudo actualizar la visita como convertida', { 
          idVisita, 
          error: errorVisita.message 
        })
      }
    }

    logger.info('buyersApi', 'Lead registrado exitosamente', { 
      idContacto: contacto.id_contacto,
      nombre: nombreValidation.cleanName,
      email
    })

    return createResponse(true, { idContacto: contacto.id_contacto })
  } catch (error) {
    logger.error('buyersApi', 'Error registrando lead', { error, nombre, email })
    return createResponse(false, null, {
      message: error.message || 'No pudimos registrar tu solicitud',
      code: error.code || 'REGISTRATION_ERROR'
    })
  }
}
