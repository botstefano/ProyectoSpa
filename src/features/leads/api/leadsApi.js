import { supabase, requireSupabase, safeSupabaseOperation, isSupabaseConfigured, isNetworkOrFetchError } from '../../../lib/supabaseClient'
import { notificarLeadCalificado, notificarPropuestaAceptada } from '../../../lib/notificaciones'
import { validateLeadScore, validateEmail, validatePhone, validateName } from '../../../lib/validators'
import { handleSupabaseError, handleValidationError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'
import { registrarTransicionFase, registrarAuditoria } from '../../../lib/auditoria'

export async function obtenerLeads() {
  if (!supabase || !isSupabaseConfigured) {
    return []
  }

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
          lead_detalle (
            lead_score,
            propuesta_aceptada,
            fecha_aceptacion,
            datos_propuesta
          ),
          descarga (interes, tipo_piel),
          enriquecimiento_contacto (
            edad,
            distrito,
            ocupacion,
            presupuesto,
            disponibilidad,
            preferencia_aroma,
            preferencia_musica,
            preferencia_temperatura,
            sensibilidad_piel,
            otras_preferencias,
            especialidad,
            nivel_estudios,
            universidad,
            empresa,
            cargo,
            situacion_laboral,
            motivo_principal,
            frecuencia_deseada,
            completado,
            fecha_completado
          )
        `)
        .order('fecha_registro', { ascending: false })

      if (error) {
        if (isNetworkOrFetchError(error)) {
          logger.warn('leadsApi', 'Sin conexión a Supabase para obtener leads. Activando datos de respaldo.')
          return []
        }
        throw handleSupabaseError(error, 'obtener leads')
      }

      const filtrados = (data || []).filter(c => {
        const estadoObj = Array.isArray(c.estado_contacto) ? c.estado_contacto[0] : c.estado_contacto;
        const estado = estadoObj?.nombre_estado;
        return estado === 'buyer' || estado === 'lead' || estado === 'customer' || estado === 'payer';
      });

      logger.info('leadsApi', `Leads obtenidos: ${filtrados.length}`)
      return filtrados
    } catch (error) {
      if (isNetworkOrFetchError(error)) {
        logger.warn('leadsApi', 'Sin conexión con Supabase para obtener leads, usando datos de respaldo')
        return []
      }
      logger.error('leadsApi', 'Error obteniendo leads', { error })
      return []
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
 * Calcula lead score automáticamente unificando:
 * 1. Formulario inicial (Buyers / Landing) -> hasta 35 pts
 * 2. Formulario de Enriquecimiento (Perfil profundo y gustos) -> hasta 35 pts
 * 3. Ciclo de vida de la Propuesta (Enviada, Aceptada o Rechazada) -> hasta 30 pts
 */
export function calcularLeadScoreAutomatico(contacto = {}, enriquecimiento = {}, propuesta = {}) {
  // Si la propuesta fue rechazada explícitamente, el lead se enfría inmediatamente
  if (propuesta?.estado === 'rechazada' || propuesta?.rechazada) {
    return 20 // Frío ❄️
  }

  // Si la propuesta ya fue aceptada, el lead está en máxima conversión
  if (propuesta?.aceptada || propuesta?.estado === 'aceptada') {
    return 95 // Caliente 🔥 (Listo para pago)
  }

  let score = 0

  // ── 1. FORMULARIO INICIAL (BUYERS / LANDING) - Máximo 35 pts ──
  // Fuente de captación (máx. 12 pts)
  if (contacto.fuente === 'Convenio') score += 12
  else if (contacto.fuente === 'Instagram Ads' || contacto.fuente === 'TikTok Ads') score += 10
  else score += 6 // Orgánico

  // Completitud de contacto (máx. 13 pts)
  if (contacto.email && contacto.telefono) score += 13
  else if (contacto.email || contacto.telefono) score += 7

  // Interés inicial en servicio (máx. 10 pts)
  const interes = (contacto.interes || '').toLowerCase()
  if (interes.includes('facial') || interes.includes('corporal')) score += 10
  else if (interes.includes('relaj') || interes.includes('masaje') || interes.includes('piedras')) score += 9
  else score += 6

  // ── 2. FORMULARIO DE ENRIQUECIMIENTO (PERFIL PROFUNDO) - Máximo 35 pts ──
  const formCompletado = Boolean(
    enriquecimiento?.completado || 
    enriquecimiento?.fecha_completado ||
    enriquecimiento?.enriquecimientoCompletado
  )

  if (formCompletado) {
    score += 15 // Gran salto de calidad: el cliente dedicó tiempo a detallar su perfil

    // Presupuesto informado
    const presupuesto = String(enriquecimiento.presupuesto || '').toLowerCase()
    if (presupuesto && !presupuesto.includes('no especificado')) {
      score += 7
    }

    // Frecuencia deseada (frecuencia regular indica mayor recurrencia)
    const frec = String(enriquecimiento.frecuencia_deseada || enriquecimiento.frecuencia || '').toLowerCase()
    if (frec && (frec.includes('mensual') || frec.includes('quincenal') || frec.includes('semanal') || frec.includes('regular'))) {
      score += 7
    } else if (frec) {
      score += 4
    }

    // Preferencias sensoriales (aroma, música, temperatura) y motivo
    if (enriquecimiento.preferencia_aroma || enriquecimiento.aroma || enriquecimiento.motivo_principal || enriquecimiento.motivo) {
      score += 6
    }
  }

  // ── 3. CICLO DE VIDA DE LA PROPUESTA - Máximo 30 pts ──
  if (propuesta?.estado === 'enviada' || propuesta?.enviada || propuesta?.token) {
    score += 15 // La propuesta fue enviada y está en manos del cliente
  }

  if (propuesta?.interacciones > 0 || propuesta?.enNegociacion) {
    score += 10 // El cliente ha interactuado activamente con el chatbot
  }

  // ── Factor de recencia (máx. 5 pts de bonificación de frescura) ──
  if (contacto.fecha_registro) {
    const dias = Math.floor((new Date() - new Date(contacto.fecha_registro)) / (1000 * 60 * 60 * 24))
    if (dias <= 7) score += 5
    else if (dias <= 21) score += 3
  }

  return Math.min(100, Math.max(10, score))
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
 * Califica automáticamente un lead basado en sus datos combinados
 */
export async function calificarLeadAutomatico(idContacto, datosContacto = {}, datosEnriquecimiento = {}, datosPropuesta = {}) {
  try {
    const score = calcularLeadScoreAutomatico(datosContacto, datosEnriquecimiento, datosPropuesta)
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

    // Calcular nuevo score proporcional conservando la diferenciación del lead
    const scoreActual = existingLead?.lead_score || 55
    // Aceptar propuesta suma +20 pts de bonificación y asegura estar en rango caliente (mínimo 75)
    const scoreAceptado = Math.min(100, Math.max(scoreActual + 20, 75))

    // Si no existe el registro, crearlo con el score calculado
    if (!existingLead) {
      logger.info('leadsApi', 'Creando registro en lead_detalle para aceptar propuesta')
      const { error: insertError } = await client
        .from('lead_detalle')
        .insert({
          id_contacto: idContacto,
          lead_score: scoreAceptado,
          fecha_calificacion: new Date().toISOString(),
          propuesta_aceptada: true,
          fecha_aceptacion: new Date().toISOString(),
          datos_propuesta: datosPropuesta
        })

      if (insertError) throw handleSupabaseError(insertError, 'crear lead_detalle')
      
      // Asegurar que el estado del contacto sea 'lead'
      await transicionarBuyerALead(idContacto)
    } else {
      // Si existe, actualizarlo sumando la bonificación de aceptación
      const { error } = await client
        .from('lead_detalle')
        .update({
          lead_score: scoreAceptado,
          fecha_calificacion: new Date().toISOString(),
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
 * Rechaza la propuesta y ajusta el lead score a Frío (20 pts)
 */
export async function rechazarPropuesta(idContacto, motivo = '') {
  try {
    const client = requireSupabase()

    const { data: existingLead } = await client
      .from('lead_detalle')
      .select('lead_score')
      .eq('id_contacto', idContacto)
      .single()

    const scoreActual = existingLead?.lead_score || 50
    // Enfría el score proporcionalmente (-35 pts, mínimo 15)
    const nuevoScore = Math.max(15, scoreActual - 35)

    const { error } = await client
      .from('lead_detalle')
      .update({
        lead_score: nuevoScore,
        fecha_calificacion: new Date().toISOString(),
        propuesta_aceptada: false
      })
      .eq('id_contacto', idContacto)

    if (error) throw handleSupabaseError(error, 'rechazar propuesta en lead_detalle')

    logger.info('leadsApi', `Propuesta rechazada para contacto ${idContacto}, score ajustado a ${nuevoScore}`, { motivo })
    return createResponse(true, { message: 'Propuesta rechazada, score actualizado', score: nuevoScore })
  } catch (error) {
    logger.error('leadsApi', 'Error rechazando propuesta', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al rechazar propuesta',
      code: 'REJECT_ERROR'
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