/**
 * Servicio de email usando Edge Function de Supabase
 * Edge Function actúa como intermediario para evitar problemas CORS con Resend API
 * Resend no permite llamadas directas desde el navegador, por eso usamos Edge Function
 */

import { logger } from './logger'
import { supabase, requireSupabase, isSupabaseConfigured } from './supabaseClient'

/**
 * Envía email usando Edge Function de Supabase con llamada directa fetch
 * @param {string} emailCliente - Email del cliente
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tipoEmail - Tipo de email ('enriquecimiento' o 'pago')
 * @param {object} datos - Datos adicionales según el tipo
 */
async function enviarEmailViaEdgeFunction(emailCliente, nombreCliente, tipoEmail, datos) {
  try {
    const client = requireSupabase()
    
    // Obtener URL y headers de Supabase
    const { data: { session } } = await client.auth.getSession()
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL o ANON_KEY no configuradas')
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-email`
    
    logger.info('emailService', 'Llamando a Edge Function', { 
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
    
    logger.info('emailService', `Email de ${tipoEmail} enviado exitosamente via Edge Function`, { 
      email: emailCliente, 
      id: data?.id 
    })

    return { 
      success: true, 
      id: data?.id,
      mensaje: 'Email enviado exitosamente'
    }
  } catch (error) {
    logger.error('emailService', `Error enviando email de ${tipoEmail} via Edge Function`, { 
      error: error.message, 
      email: emailCliente,
      stack: error.stack 
    })
    return { 
      success: false, 
      error: error.message,
      mensaje: 'Error al enviar email'
    }
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
  // Verificar si Supabase está configurado
  if (!isSupabaseConfigured) {
    logger.warn('emailService', 'Supabase no configurado, usando modo link manual')
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: 'Supabase no configurado, pero el formulario está disponible',
      linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    }
  }

  try {
    const resultado = await enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'enriquecimiento', {
      tokenEnriquecimiento,
      origen
    })

    if (resultado.success) {
      return resultado
    } else {
      // Fallback si Edge Function falla
      logger.warn('emailService', 'Edge Function falló, usando link manual', { error: resultado.error })
      return { 
        success: false, 
        modo: 'link_manual',
        mensaje: `Edge Function falló: ${resultado.error}. Formulario disponible vía link manual.`,
        linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
      }
    }
  } catch (error) {
    logger.error('emailService', 'Error en envío de email de enriquecimiento', { error })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: 'Error en envío, pero el formulario está disponible',
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
  // Verificar si Supabase está configurado
  if (!isSupabaseConfigured) {
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: 'Supabase no configurado, pero el formulario está disponible',
      linkManual: `${origen}/pago/${tokenPago}`
    }
  }

  try {
    const resultado = await enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'pago', {
      tokenPago,
      origen,
      ...datosPago
    })

    if (resultado.success) {
      return resultado
    } else {
      logger.warn('emailService', 'Edge Function falló para pago, usando link manual', { error: resultado.error })
      return { 
        success: false, 
        modo: 'link_manual',
        mensaje: `Edge Function falló: ${resultado.error}. Formulario disponible vía link manual.`,
        linkManual: `${origen}/pago/${tokenPago}`
      }
    }
  } catch (error) {
    logger.error('emailService', 'Error en envío de email de pago', { error })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: 'Error en envío, pero el formulario está disponible',
      linkManual: `${origen}/pago/${tokenPago}`
    }
  }
}

/**
 * Envía recordatorio de enriquecimiento
 */
export async function enviarRecordatorioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  // Verificar si Supabase está configurado
  if (!isSupabaseConfigured) {
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: 'Supabase no configurado, pero el formulario está disponible',
      linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    }
  }

  try {
    const resultado = await enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'enriquecimiento', {
      tokenEnriquecimiento,
      origen,
      esRecordatorio: true
    })

    if (resultado.success) {
      return resultado
    } else {
      logger.warn('emailService', 'Edge Function falló para recordatorio, usando link manual', { error: resultado.error })
      return { 
        success: false, 
        modo: 'link_manual',
        mensaje: `Edge Function falló: ${resultado.error}. Formulario disponible vía link manual.`,
        linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
      }
    }
  } catch (error) {
    logger.error('emailService', 'Error en envío de recordatorio', { error })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: 'Error en envío, pero el formulario está disponible',
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