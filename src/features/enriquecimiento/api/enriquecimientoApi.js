import { supabase, requireSupabase, safeSupabaseOperation } from '../../../lib/supabaseClient'
import { generarTokenEnriquecimiento, enviarFormularioEnriquecimiento } from '../../../lib/emailService'
import { handleSupabaseError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'

/**
 * Genera un formulario de enriquecimiento para un contacto
 */
export async function generarFormularioEnriquecimiento(idContacto) {
  try {
    const client = requireSupabase()

    // Verificar si ya existe un formulario de enriquecimiento
    const { data: existing, error: checkError } = await client
      .from('enriquecimiento_contacto')
      .select('id_enriquecimiento, token_enriquecimiento, completado, creado_at')
      .eq('id_contacto', idContacto)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw handleSupabaseError(checkError, 'verificar enriquecimiento existente')
    }

    // Si ya existe y no está completado, reutilizar el token
    if (existing && !existing.completado) {
      const creadoEn = new Date(existing.creado_at)
      const expiraEn = new Date(creadoEn.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      if (new Date() < expiraEn) {
        logger.info('enriquecimientoApi', 'Reutilizando token existente', { idContacto })
        return createResponse(true, {
          token: existing.token_enriquecimiento,
          reutilizado: true,
          expiraEn: expiraEn.toISOString()
        })
      }
    }

    // Generar nuevo token
    const token = generarTokenEnriquecimiento()

    // Insertar nuevo registro de enriquecimiento
    const { data, error } = await client
      .from('enriquecimiento_contacto')
      .insert({
        id_contacto: idContacto,
        token_enriquecimiento: token
      })
      .select('token_enriquecimiento')
      .single()

    if (error) throw handleSupabaseError(error, 'crear formulario de enriquecimiento')

    logger.info('enriquecimientoApi', 'Formulario de enriquecimiento creado', { idContacto, token })
    return createResponse(true, { token: data.token_enriquecimiento, reutilizado: false })
  } catch (error) {
    logger.error('enriquecimientoApi', 'Error generando formulario de enriquecimiento', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al generar formulario de enriquecimiento',
      code: error.code || 'ENRIQUECIMIENTO_ERROR'
    })
  }
}

/**
 * Envía email de enriquecimiento a un contacto
 */
export async function enviarEmailEnriquecimiento(idContacto, emailCliente, nombreCliente) {
  try {
    // Primero generar el formulario de enriquecimiento
    const formResult = await generarFormularioEnriquecimiento(idContacto)
    
    if (!formResult.success) {
      return formResult
    }

    const token = formResult.data.token
    const origen = window.location.origin

    // Enviar email usando Resend
    const emailResult = await enviarFormularioEnriquecimiento(
      emailCliente,
      nombreCliente,
      token,
      origen
    )

    if (!emailResult.success) {
      logger.warn('enriquecimientoApi', 'Email no enviado, pero formulario creado', { 
        idContacto, 
        email: emailResult 
      })
      return createResponse(true, {
        token: token,
        emailEnviado: false,
        mensaje: 'Formulario creado pero email no enviado (revisar configuración RESEND)',
        linkManual: `${origen}/enriquecimiento/${token}`
      })
    }

    logger.info('enriquecimientoApi', 'Email de enriquecimiento enviado exitosamente', { 
      idContacto, 
      email: emailCliente 
    })

    return createResponse(true, {
      token: token,
      emailEnviado: true,
      mensaje: 'Email enviado exitosamente'
    })
  } catch (error) {
    logger.error('enriquecimientoApi', 'Error enviando email de enriquecimiento', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al enviar email de enriquecimiento',
      code: error.code || 'EMAIL_ERROR'
    })
  }
}

/**
 * Obtiene datos de enriquecimiento de un contacto
 */
export async function obtenerDatosEnriquecimiento(idContacto) {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('enriquecimiento_contacto')
        .select('*')
        .eq('id_contacto', idContacto)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error, 'obtener datos de enriquecimiento')
      }

      return data
    } catch (error) {
      logger.error('enriquecimientoApi', 'Error obteniendo datos de enriquecimiento', { idContacto, error })
      return null
    }
  }, null)
}

/**
 * Verifica si un contacto tiene datos de enriquecimiento completados
 */
export async function tieneEnriquecimientoCompletado(idContacto) {
  const datos = await obtenerDatosEnriquecimiento(idContacto)
  return datos && datos.completado
}

/**
 * Obtiene datos completos del contacto (incluyendo enriquecimiento si existe)
 */
export async function obtenerContactoCompleto(idContacto) {
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
          estado_contacto (nombre_estado),
          lead_detalle (lead_score, propuesta_aceptada),
          descarga (interes),
          enriquecimiento_contacto (*)
        `)
        .eq('id_contacto', idContacto)
        .single()

      if (error) throw handleSupabaseError(error, 'obtener contacto completo')

      return data
    } catch (error) {
      logger.error('enriquecimientoApi', 'Error obteniendo contacto completo', { idContacto, error })
      return null
    }
  }, null)
}

/**
 * Envía recordatorio de enriquecimiento
 */
export async function enviarRecordatorio(idContacto, emailCliente, nombreCliente) {
  try {
    const datos = await obtenerDatosEnriquecimiento(idContacto)
    
    if (!datos || datos.completado) {
      return createResponse(false, null, {
        message: 'No se puede enviar recordatorio: formulario ya completado o no existe'
      })
    }

    const token = datos.token_enriquecimiento
    const origen = window.location.origin

    const emailResult = await enviarRecordatorioEnriquecimiento(
      emailCliente,
      nombreCliente,
      token,
      origen
    )

    return emailResult
  } catch (error) {
    logger.error('enriquecimientoApi', 'Error enviando recordatorio', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al enviar recordatorio',
      code: error.code || 'RECORDATORIO_ERROR'
    })
  }
}