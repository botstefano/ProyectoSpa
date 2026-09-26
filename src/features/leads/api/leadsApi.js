import { supabase, requireSupabase, safeSupabaseOperation } from '../../../lib/supabaseClient'
import { notificarLeadCalificado, notificarPropuestaAceptada } from '../../../lib/notificaciones'
import { validateLeadScore, validateEmail, validatePhone, validateName } from '../../../lib/validators'
import { handleSupabaseError, handleValidationError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'
import { registrarTransicionFase, registrarAuditoria } from '../../../lib/auditoria'

export async function obtenerLeads() {
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
          lead_detalle (lead_score),
          descarga (interes),
          enriquecimiento_contacto (
            edad,
            distrito,
            ocupacion,
            presupuesto,
            disponibilidad,
            preferencia_aroma,
            preferencia_musica,
            sensibilidad_piel,
            motivo_principal,
            frecuencia_deseada,
            completado,
            fecha_completado
          )
        `)
        .order('fecha_registro', { ascending: false })

      if (error) throw handleSupabaseError(error, 'obtener leads')

      const filtrados = data.filter(c => {
        const estadoObj = Array.isArray(c.estado_contacto) ? c.estado_contacto[0] : c.estado_contacto;
        const estado = estadoObj?.nombre_estado;
        return estado === 'buyer' || estado === 'lead' || estado === 'customer' || estado === 'payer';
      });

      logger.info('leadsApi', `Leads obtenidos: ${filtrados.length}`)
      return filtrados
    } catch (error) {
      logger.error('leadsApi', 'Error obteniendo leads', { error })
      throw error
    }
  }, [])
}

/**
 * Transición: BUYER → LEAD
 * Cambia el estado del contacto de 'buyer' a 'lead'
 */
async function transicionarBuyerALead(idContacto) {
  try {
    const client = requireSupabase()
    const { data: estado, error: stateError } = await client
      .from('estado_contacto')
      .select('id_estado')
      .eq('nombre_estado', 'lead')
      .single()

    if (stateError) throw handleSupabaseError(stateError, 'obtener estado lead')

    const { error } = await client
      .from('contacto')
      .update({ id_estado: estado.id_estado })
      .eq('id_contacto', idContacto)

    if (error) throw handleSupabaseError(error, 'transicionar a lead')
    
    logger.info('leadsApi', `Contacto ${idContacto} transicionado a LEAD`)
    
    // Registrar auditoría de la transición
    await registrarTransicionFase(idContacto, 'buyer', 'lead', {})
  } catch (error) {
    logger.error('leadsApi', 'Error en transición BUYER → LEAD', { idContacto, error })
    throw error
  }
}

/**
 * Calcula lead score automáticamente basado en múltiples factores
 */
function calcularLeadScoreAutomatico(contacto) {
  let score = 0
  
  // Factor 1: Fuente de captación (30 puntos máximo)
  if (contacto.fuente === 'Instagram Ads') score += 25
  else if (contacto.fuente === 'TikTok Ads') score += 20
  else if (contacto.fuente === 'Convenio') score += 30
  else score += 15 // Orgánico
  
  // Factor 2: Completitud de datos (20 puntos máximo)
  if (contacto.email && contacto.telefono) score += 20
  else if (contacto.email || contacto.telefono) score += 10
  
  // Factor 3: Interés específico (25 puntos máximo)
  if (contacto.interes === 'facial') score += 25
  else if (contacto.interes === 'corporal') score += 20
  else score += 15 // relajacion
  
  // Factor 4: Tipo de piel (15 puntos máximo)
  if (contacto.tipoPiel && contacto.tipoPiel !== 'no_se') score += 15
  else score += 5
  
  // Factor 5: Tiempo desde registro (10 puntos máximo)
  const diasDesdeRegistro = Math.floor((new Date() - new Date(contacto.fecha_registro)) / (1000 * 60 * 60 * 24))
  if (diasDesdeRegistro <= 7) score += 10
  else if (diasDesdeRegistro <= 30) score += 7
  else score += 3
  
  return Math.min(100, Math.max(0, score))
}

export async function calificarLead(idContacto, score, automatico = false) {
  try {
    // Validar score
    const scoreValidation = validateLeadScore(score)
    if (!scoreValidation.valid) {
      throw handleValidationError('lead_score', scoreValidation.error, score)
    }

    const client = requireSupabase()

    const { error } = await client
      .from('lead_detalle')
      .upsert({ 
        id_contacto: idContacto, 
        lead_score: scoreValidation.cleanScore, 
        fecha_calificacion: new Date().toISOString() 
      })

    if (error) throw handleSupabaseError(error, 'calificar lead')

    logger.info('leadsApi', `Lead ${idContacto} calificado con score ${score}`, { automatico })

    // Si el score es suficiente (>= 50), transicionar automáticamente a LEAD
    if (scoreValidation.cleanScore >= 50) {
      try {
        await transicionarBuyerALead(idContacto)
        // Enviar notificación
        await notificarLeadCalificado(idContacto, scoreValidation.cleanScore)
      } catch (error) {
        logger.warn('leadsApi', 'Error en transición automática BUYER → LEAD', { error })
        // No bloqueamos el flujo si falla la transición
      }
    }

    return createResponse(true, { score: scoreValidation.cleanScore })
  } catch (error) {
    logger.error('leadsApi', 'Error calificando lead', { idContacto, score, error })
    return createResponse(false, null, {
      message: error.message || 'Error al calificar lead',
      code: error.code || 'SCORING_ERROR'
    })
  }
}

/**
 * Califica automáticamente un lead basado en sus datos
 */
export async function calificarLeadAutomatico(idContacto, datosContacto) {
  try {
    const score = calcularLeadScoreAutomatico(datosContacto)
    return await calificarLead(idContacto, score, true)
  } catch (error) {
    logger.error('leadsApi', 'Error en calificación automática', { idContacto, error })
    return createResponse(false, null, {
      message: 'Error en calificación automática',
      code: 'AUTO_SCORING_ERROR'
    })
  }
}

/**
 * Acepta propuesta y prepara para transición a PAYER
 * Esto se llama cuando el lead acepta la propuesta en Fase 2
 */
export async function aceptarPropuesta(idContacto, datosPropuesta) {
  try {
    const client = requireSupabase()

    // Primero verificar si existe el registro en lead_detalle
    const { data: existingLead, error: checkError } = await client
      .from('lead_detalle')
      .select('lead_score')
      .eq('id_contacto', idContacto)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw handleSupabaseError(checkError, 'verificar lead_detalle')
    }

    // Si no existe el registro, crearlo primero con el score actual
    if (!existingLead) {
      logger.info('leadsApi', 'Creando registro en lead_detalle para aceptar propuesta')
      const { error: insertError } = await client
        .from('lead_detalle')
        .insert({
          id_contacto: idContacto,
          lead_score: 50, // Score mínimo para que pueda pasar a PAYERS
          fecha_calificacion: new Date().toISOString(),
          propuesta_aceptada: true,
          fecha_aceptacion: new Date().toISOString(),
          datos_propuesta: datosPropuesta
        })

      if (insertError) throw handleSupabaseError(insertError, 'crear lead_detalle')
      
      // Asegurar que el estado del contacto sea 'lead'
      await transicionarBuyerALead(idContacto)
    } else {
      // Si existe, actualizarlo
      const { error } = await client
        .from('lead_detalle')
        .update({
          propuesta_aceptada: true,
          fecha_aceptacion: new Date().toISOString(),
          datos_propuesta: datosPropuesta
        })
        .eq('id_contacto', idContacto)

      if (error) throw handleSupabaseError(error, 'aceptar propuesta')
      
      // Asegurar que el estado del contacto sea 'lead' (por si acaso)
      await transicionarBuyerALead(idContacto)
    }

    // Enviar notificación a PAYERS
    try {
      await notificarPropuestaAceptada(idContacto, datosPropuesta)
      logger.info('leadsApi', 'Notificación enviada a PAYERS')
    } catch (notifError) {
      logger.warn('leadsApi', 'Error enviando notificación a PAYERS', { error: notifError })
      // No bloqueamos el flujo si falla la notificación
    }

    return createResponse(true, { message: 'Propuesta aceptada, listo para pasar a PAYERS' })
  } catch (error) {
    logger.error('leadsApi', 'Error aceptando propuesta', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al aceptar propuesta',
      code: error.code || 'PROPOSAL_ERROR'
    })
  }
}

/**
 * Actualiza los datos del contacto y del lead_detalle
 */
export async function actualizarLead(idContacto, datosContacto, datosLeadDetalle) {
  try {
    const client = requireSupabase()

    // Validar datos del contacto si se proporcionan
    if (datosContacto && Object.keys(datosContacto).length > 0) {
      if (datosContacto.nombre) {
        const nombreValidation = validateName(datosContacto.nombre)
        if (!nombreValidation.valid) {
          throw handleValidationError('nombre', nombreValidation.error, datosContacto.nombre)
        }
        datosContacto.nombre = nombreValidation.cleanName
      }
      
      if (datosContacto.email) {
        const emailValidation = validateEmail(datosContacto.email)
        if (!emailValidation.valid) {
          throw handleValidationError('email', emailValidation.error, datosContacto.email)
        }
      }
      
      if (datosContacto.telefono) {
        const phoneValidation = validatePhone(datosContacto.telefono)
        if (!phoneValidation.valid) {
          throw handleValidationError('telefono', phoneValidation.error, datosContacto.telefono)
        }
        datosContacto.telefono = phoneValidation.cleanPhone
      }
    }

    // Validar lead score si se proporciona
    if (datosLeadDetalle && datosLeadDetalle.lead_score !== undefined) {
      const scoreValidation = validateLeadScore(datosLeadDetalle.lead_score)
      if (!scoreValidation.valid) {
        throw handleValidationError('lead_score', scoreValidation.error, datosLeadDetalle.lead_score)
      }
      datosLeadDetalle.lead_score = scoreValidation.cleanScore
    }

    // Actualizar datos del contacto si se proporcionan
    if (datosContacto && Object.keys(datosContacto).length > 0) {
      const { error: contactError } = await client
        .from('contacto')
        .update(datosContacto)
        .eq('id_contacto', idContacto)

      if (contactError) throw handleSupabaseError(contactError, 'actualizar contacto')
    }

    // Actualizar datos del lead_detalle si se proporcionan
    if (datosLeadDetalle && Object.keys(datosLeadDetalle).length > 0) {
      const { error: leadError } = await client
        .from('lead_detalle')
        .update(datosLeadDetalle)
        .eq('id_contacto', idContacto)

      if (leadError) throw handleSupabaseError(leadError, 'actualizar lead_detalle')
    }

    logger.info('leadsApi', `Lead ${idContacto} actualizado exitosamente`)
    return createResponse(true, { message: 'Datos actualizados correctamente' })
  } catch (error) {
    logger.error('leadsApi', 'Error actualizando lead', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al actualizar lead',
      code: error.code || 'UPDATE_ERROR'
    })
  }
}