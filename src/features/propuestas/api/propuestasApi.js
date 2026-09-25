import { supabase, requireSupabase, safeSupabaseOperation } from '../../../lib/supabaseClient'
import { enviarFormularioEnriquecimiento } from '../../../lib/emailService'
import { sendMessageToMistral, applyProposalChanges, generarTokenPropuesta, validarTokenPropuesta } from '../../../lib/mistralService'
import { handleSupabaseError, createResponse } from '../../../lib/errorHandler'
import { logger } from '../../../lib/logger'
import { aceptarPropuesta } from '../../leads/api/leadsApi'

/**
 * Genera una propuesta interactiva con chatbot para un contacto
 */
export async function generarPropuestaChatbot(idContacto, datosPropuestaInicial) {
  try {
    const client = requireSupabase()

    // Verificar si ya existe una propuesta activa
    const { data: existing, error: checkError } = await client
      .from('propuesta_chatbot')
      .select('id_propuesta, token_propuesta, estado_propuesta, expira_en')
      .eq('id_contacto', idContacto)
      .eq('estado_propuesta', 'enviada')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw handleSupabaseError(checkError, 'verificar propuesta existente')
    }

    // Si ya existe una propuesta activa y no ha expirado, reutilizar
    if (existing && new Date(existing.expira_en) > new Date()) {
      logger.info('propuestasApi', 'Reutilizando propuesta existente', { idContacto })
      return createResponse(true, {
        token: existing.token_propuesta,
        reutilizado: true,
        expiraEn: existing.expira_en
      })
    }

    // Generar nuevo token
    const token = generarTokenPropuesta()

    // Insertar nueva propuesta
    const { data, error } = await client
      .from('propuesta_chatbot')
      .insert({
        id_contacto: idContacto,
        token_propuesta: token,
        propuesta_original: datosPropuestaInicial,
        propuesta_actual: datosPropuestaInicial,
        estado_propuesta: 'enviada',
        historial_conversacion: []
      })
      .select('token_propuesta')
      .single()

    if (error) throw handleSupabaseError(error, 'crear propuesta chatbot')

    logger.info('propuestasApi', 'Propuesta chatbot creada', { idContacto, token })
    return createResponse(true, { token: data.token_propuesta, reutilizado: false })
  } catch (error) {
    logger.error('propuestasApi', 'Error generando propuesta chatbot', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al generar propuesta chatbot',
      code: error.code || 'PROPUESTA_ERROR'
    })
  }
}

/**
 * Envía email de propuesta con chatbot a un contacto
 */
export async function enviarEmailPropuesta(idContacto, emailCliente, nombreCliente, datosPropuesta) {
  try {
    // Primero generar la propuesta chatbot
    const formResult = await generarPropuestaChatbot(idContacto, datosPropuesta)
    
    if (!formResult.success) {
      return formResult
    }

    const token = formResult.data.token
    const origen = window.location.origin

    // Reutilizar el servicio de email para enviar la propuesta
    const emailResult = await enviarFormularioEnriquecimiento(
      emailCliente,
      nombreCliente,
      token,
      origen
    )

    if (!emailResult.success) {
      logger.warn('propuestasApi', 'Email no enviado, pero propuesta creada', { 
        idContacto, 
        email: emailResult 
      })
      return createResponse(true, {
        token: token,
        emailEnviado: false,
        mensaje: 'Propuesta creada pero email no enviado (revisar configuración RESEND)',
        linkManual: `${origen}/propuesta/${token}`
      })
    }

    logger.info('propuestasApi', 'Email de propuesta enviado exitosamente', { 
      idContacto, 
      email: emailCliente 
    })

    return createResponse(true, {
      token: token,
      emailEnviado: true,
      mensaje: 'Email enviado exitosamente'
    })
  } catch (error) {
    logger.error('propuestasApi', 'Error enviando email de propuesta', { idContacto, error })
    return createResponse(false, null, {
      message: error.message || 'Error al enviar email de propuesta',
      code: error.code || 'EMAIL_ERROR'
    })
  }
}

/**
 * Obtiene datos de una propuesta por token
 */
export async function obtenerPropuestaPorToken(token) {
  return safeSupabaseOperation(async (client) => {
    try {
      // Validar formato del token
      if (!validarTokenPropuesta(token)) {
        throw new Error('Token inválido')
      }

      const { data, error } = await client
        .from('propuesta_chatbot')
        .select(`
          id_propuesta,
          id_contacto,
          propuesta_actual,
          estado_propuesta,
          historial_conversacion,
          fecha_envio,
          expira_en,
          contacto (nombre, email)
        `)
        .eq('token_propuesta', token)
        .single()

      if (error) throw handleSupabaseError(error, 'obtener propuesta por token')

      // Verificar si ha expirado
      if (new Date(data.expira_en) < new Date()) {
        throw new Error('La propuesta ha expirado')
      }

      // Verificar si ya fue aceptada/rechazada
      if (data.estado_propuesta === 'aceptada') {
        throw new Error('Esta propuesta ya fue aceptada')
      }
      if (data.estado_propuesta === 'rechazada') {
        throw new Error('Esta propuesta fue rechazada')
      }

      return data
    } catch (error) {
      logger.error('propuestasApi', 'Error obteniendo propuesta por token', { token, error })
      throw error
    }
  }, null)
}

/**
 * Envía mensaje al chatbot y actualiza propuesta
 */
export async function enviarMensajeChatbot(idPropuesta, mensaje, conversationHistory, currentProposal) {
  try {
    const mistralApiKey = import.meta.env.VITE_MISTRAL_API_KEY

    // Llamar a Mistral
    const mistralResponse = await sendMessageToMistral(
      mensaje,
      conversationHistory,
      currentProposal,
      mistralApiKey
    )

    if (!mistralResponse.success) {
      throw new Error(mistralResponse.error || 'Error en chatbot')
    }

    // Si hay cambios en la propuesta, aplicarlos
    let updatedProposal = currentProposal
    if (mistralResponse.proposalChanges) {
      updatedProposal = applyProposalChanges(currentProposal, mistralResponse.proposalChanges)
      
      // Actualizar en base de datos
      await actualizarPropuestaEnBD(idPropuesta, updatedProposal)
    }

    // Registrar mensaje en historial
    await registrarMensajeEnHistorial(idPropuesta, 'user', mensaje)
    await registrarMensajeEnHistorial(idPropuesta, 'assistant', mistralResponse.message)

    return createResponse(true, {
      message: mistralResponse.message,
      updatedProposal: updatedProposal,
      proposalChanges: mistralResponse.proposalChanges,
      confirmar: mistralResponse.confirmar || false
    })
  } catch (error) {
    logger.error('propuestasApi', 'Error enviando mensaje chatbot', { idPropuesta, error })
    return createResponse(false, null, {
      message: error.message || 'Error en chatbot',
      code: error.code || 'CHATBOT_ERROR'
    })
  }
}

/**
 * Actualiza propuesta en base de datos
 */
async function actualizarPropuestaEnBD(idPropuesta, nuevaPropuesta) {
  return safeSupabaseOperation(async (client) => {
    const { error } = await client
      .from('propuesta_chatbot')
      .update({
        propuesta_actual: nuevaPropuesta,
        estado_propuesta: 'negociando'
      })
      .eq('id_propuesta', idPropuesta)

    if (error) throw error
  }, null)
}

/**
 * Registra mensaje en historial de conversación
 */
async function registrarMensajeEnHistorial(idPropuesta, rol, mensaje, metadata = {}) {
  return safeSupabaseOperation(async (client) => {
    const { data: currentData } = await client
      .from('propuesta_chatbot')
      .select('historial_conversacion')
      .eq('id_propuesta', idPropuesta)
      .single()

    const newMessage = {
      rol,
      mensaje,
      timestamp: new Date().toISOString(),
      metadata
    }

    const updatedHistory = [...(currentData?.historial_conversacion || []), newMessage]

    const { error } = await client
      .from('propuesta_chatbot')
      .update({
        historial_conversacion: updatedHistory,
        fecha_ultima_interaccion: new Date().toISOString()
      })
      .eq('id_propuesta', idPropuesta)

    if (error) throw error
  }, null)
}

/**
 * Confirma y acepta la propuesta final
 */
export async function confirmarPropuestaFinal(idPropuesta, idContacto, propuestaFinal) {
  try {
    const client = requireSupabase()

    // Actualizar estado de la propuesta
    const { error: updateError } = await client
      .from('propuesta_chatbot')
      .update({
        estado_propuesta: 'aceptada',
        fecha_aceptacion: new Date().toISOString(),
        propuesta_actual: propuestaFinal
      })
      .eq('id_propuesta', idPropuesta)

    if (updateError) throw handleSupabaseError(updateError, 'confirmar propuesta')

    // Aceptar propuesta en el sistema principal (LEADS → PAYERS)
    const resultadoAceptacion = await aceptarPropuesta(idContacto, propuestaFinal)

    if (!resultadoAceptacion.success) {
      throw new Error(resultadoAceptacion.error?.message || 'Error aceptando propuesta en sistema principal')
    }

    logger.info('propuestasApi', 'Propuesta confirmada exitosamente', { idPropuesta, idContacto })
    return createResponse(true, { 
      message: 'Propuesta confirmada y aceptada',
      transicionAPayers: true
    })
  } catch (error) {
    logger.error('propuestasApi', 'Error confirmando propuesta', { idPropuesta, error })
    return createResponse(false, null, {
      message: error.message || 'Error al confirmar propuesta',
      code: error.code || 'CONFIRMACION_ERROR'
    })
  }
}

/**
 * Obtiene propuestas activas de un contacto
 */
export async function obtenerPropuestasContacto(idContacto) {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('propuesta_chatbot')
        .select('*')
        .eq('id_contacto', idContacto)
        .order('fecha_envio', { ascending: false })

      if (error) throw handleSupabaseError(error, 'obtener propuestas contacto')

      return data
    } catch (error) {
      logger.error('propuestasApi', 'Error obteniendo propuestas contacto', { idContacto, error })
      return []
    }
  }, [])
}