/**
 * Servicio de email usando Resend
 * Permite enviar emails profesionales a los clientes
 */

import { logger } from './logger'
import { supabase, requireSupabase } from './supabaseClient'

/**
 * Envía email usando Edge Function de Supabase (soluciona problemas CORS)
 * @param {string} emailCliente - Email del cliente
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tipoEmail - Tipo de email ('enriquecimiento' o 'pago')
 * @param {object} datos - Datos adicionales según el tipo
 */
export async function enviarEmailViaEdgeFunction(emailCliente, nombreCliente, tipoEmail, datos) {
  try {
    const client = requireSupabase()
    
    const { data, error } = await client.functions.invoke('send-email', {
      body: {
        emailCliente,
        nombreCliente,
        tipoEmail,
        datos
      }
    })

    if (error) throw error

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
    logger.error('emailService', `Error enviando email de ${tipoEmail} via Edge Function`, { error, email: emailCliente })
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
  return enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'enriquecimiento', {
    tokenEnriquecimiento,
    origen
  })
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
  return enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'pago', {
    tokenPago,
    origen,
    ...datosPago
  })
}

/**
 * Envía recordatorio de enriquecimiento
 */
export async function enviarRecordatorioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  return enviarEmailViaEdgeFunction(emailCliente, nombreCliente, 'enriquecimiento', {
    tokenEnriquecimiento,
    origen,
    esRecordatorio: true
  })
}

export default {
  enviarFormularioEnriquecimiento,
  generarTokenEnriquecimiento,
  validarTokenFormato,
  enviarRecordatorioEnriquecimiento,
  enviarEmailPago
}