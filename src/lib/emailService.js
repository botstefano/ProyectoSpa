/**
 * Servicio de email usando Edge Function de Supabase
 * Edge Function se llama 'super-task' en lugar de 'send-email'
 */

import { logger } from './logger'
import { isSupabaseConfigured } from './supabaseClient'

/**
 * Envía email usando Edge Function de Supabase (super-task)
 * @param {string} emailCliente - Email del cliente
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tipoEmail - Tipo de email ('enriquecimiento' o 'pago')
 * @param {object} datos - Datos adicionales según el tipo
 */
async function enviarEmailViaEdgeFunction(emailCliente, nombreCliente, tipoEmail, datos) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL o ANON_KEY no configuradas')
    }

    // Usar el nombre correcto de la función: super-task
    const functionUrl = `${supabaseUrl}/functions/v1/super-task`
    
    logger.info('emailService', 'Llamando a Edge Function super-task', { 
      url: functionUrl,
      email: emailCliente,
      tipo: tipoEmail
    })

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emailCliente,
        nombreCliente,
        tipoEmail,
        datos
      })
    })

    logger.info('emailService', 'Respuesta de Edge Function', { 
      status: response.status,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('emailService', 'Edge Function respondió con error', { 
        status: response.status,
        error: errorText 
      })
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    logger.info('emailService', `Email enviado via Edge Function super-task`, { 
      email: emailCliente, 
      tipo: tipoEmail,
      id: data?.id 
    })

    return { 
      success: true, 
      id: data?.id,
      mensaje: 'Email enviado exitosamente'
    }
  } catch (error) {
    logger.error('emailService', `Error enviando email via Edge Function`, { 
      error: error.message, 
      email: emailCliente 
    })
    throw error
  }
}

/**
 * Envía email de enriquecimiento de contacto
 * @param {string} emailCliente - Email del cliente (su Gmail)
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tokenEnriquecimiento - Token único para el formulario
 * @param {string} origen - URL base del sitio
 */
export async function enviarFormularioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  try {
    const resultado = await enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'enriquecimiento', {
      tokenEnriquecimiento,
      origen
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'Edge Function falló, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Edge Function falló: ${error.message}. Formulario disponible vía link manual.`,
      linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    }
  }
}

/**
 * Genera un token único para enriquecimiento
 */
export function generarTokenEnriquecimiento() {
  // Generar token único usando timestamp + random
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}`.toUpperCase()
}

/**
 * Verifica si un token es válido (formato y longitud)
 */
export function validarTokenFormato(token) {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('-')
  return parts.length === 2 && parts[0].length >= 8 && parts[1].length >= 8
}

/**
 * Envía email de pago a un cliente
 * @param {string} emailCliente - Email del cliente
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tokenPago - Token único para el pago
 * @param {string} origen - URL base del sitio
 * @param {object} datosPago - Datos del pago (monto, servicio, etc.)
 */
export async function enviarEmailPago(emailCliente, nombreCliente, tokenPago, origen, datosPago) {
  try {
    const resultado = await enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'pago', {
      tokenPago,
      origen,
      ...datosPago
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'Edge Function falló para pago, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Edge Function falló: ${error.message}. Formulario disponible vía link manual.`,
      linkManual: `${origen}/pago/${tokenPago}`
    }
  }
}

/**
 * Envía recordatorio de enriquecimiento
 */
export async function enviarRecordatorioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  try {
    const resultado = await enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'enriquecimiento', {
      tokenEnriquecimiento,
      origen,
      esRecordatorio: true
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'Edge Function falló para recordatorio, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Edge Function falló: ${error.message}. Formulario disponible vía link manual.`,
      linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    }
  }
}

export default {
  enviarFormularioEnriquecimiento,
  generarTokenEnriquecimiento,
  validarTokenFormato,
  enviarRecordatorioEnriquecimiento,
  enviarEmailPago
}