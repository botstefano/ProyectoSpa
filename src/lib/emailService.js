/**
 * Servicio de email usando EmailJS (sin restricciones de destinatarios)
 * Resend gratuito solo permite enviar a tu propio email
 * EmailJS permite enviar a cualquier email con plan gratuito
 */

import { logger } from './logger'

function isConfiguredEmailJS(serviceId, templateId, publicKey) {
  if (!serviceId || !templateId || !publicKey) return false
  if (
    serviceId.startsWith('TU-') ||
    templateId.startsWith('TU-') ||
    publicKey.startsWith('TU-') ||
    serviceId.includes('YOUR_') ||
    publicKey.includes('YOUR_')
  ) {
    return false
  }
  return true
}

/**
 * Envía email usando EmailJS
 * @param {string} emailCliente - Email del cliente
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tipoEmail - Tipo de email ('enriquecimiento' o 'pago')
 * @param {object} datos - Datos adicionales según el tipo
 */
async function enviarEmailViaEmailJS(emailCliente, nombreCliente, tipoEmail, datos) {
  try {
    const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    
    // Usar un solo template universal para todos los tipos de email
    const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    
    // Preparar datos según tipo con valores por defecto para el template universal
    let templateParams = {
      to_email: emailCliente,
      to_name: nombreCliente,
      link_enriquecimiento: '',
      link_propuesta: '',
      link_pago: '',
      servicio: '',
      precio: '',
      monto: ''
    }

    if (tipoEmail === 'enriquecimiento') {
      const tokenEnriquecimiento = datos?.tokenEnriquecimiento
      const origen = datos?.origen || window?.location?.origin || 'https://origen-spa.onrender.com'
      templateParams.link_enriquecimiento = `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    } else if (tipoEmail === 'propuesta') {
      const tokenPropuesta = datos?.tokenPropuesta
      const origenPropuesta = datos?.origen || window?.location?.origin || 'https://origen-spa.onrender.com'
      const servicio = datos?.servicio || 'Servicio'
      const precioRaw = datos?.precio
      const precioFormateado = typeof precioRaw === 'number'
        ? `S/ ${precioRaw.toFixed(2)}`
        : (precioRaw ? (String(precioRaw).startsWith('S/') ? String(precioRaw) : `S/ ${precioRaw}`) : 'Consultar')
      
      templateParams.link_propuesta = `${origenPropuesta}/propuesta/${tokenPropuesta}`
      templateParams.servicio = servicio
      templateParams.precio = precioFormateado
    } else if (tipoEmail === 'pago') {
      const tokenPago = datos?.tokenPago
      const origenPago = datos?.origen || window?.location?.origin || 'https://origen-spa.onrender.com'
      const montoTotal = Number(datos?.monto_total) || 0
      const servicio = datos?.servicio_contratado || 'Servicio'
      templateParams.link_pago = `${origenPago}/pago/${tokenPago}`
      templateParams.monto = `S/ ${montoTotal.toFixed(2)}`
      templateParams.servicio = servicio
    }

    if (!isConfiguredEmailJS(emailJsServiceId, emailJsTemplateId, emailJsPublicKey)) {
      logger.warn('emailService', 'EmailJS no configurado o usando valores demo. Simulando envío exitoso.', {
        email: emailCliente,
        tipo: tipoEmail,
        link: templateParams.link_propuesta || templateParams.link_enriquecimiento || templateParams.link_pago
      })
      return {
        success: true,
        simulado: true,
        mensaje: 'Email simulado exitosamente en modo demo',
        params: templateParams
      }
    }

    logger.info('emailService', 'Enviando email via EmailJS', { 
      email: emailCliente,
      tipo: tipoEmail
    })

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: emailJsServiceId,
        template_id: emailJsTemplateId,
        user_id: emailJsPublicKey,
        template_params: templateParams
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Error de respuesta en EmailJS')
      throw new Error(errorText || `Error en EmailJS (HTTP ${response.status})`)
    }

    logger.info('emailService', `Email enviado via EmailJS`, { 
      email: emailCliente, 
      tipo: tipoEmail 
    })

    return { 
      success: true, 
      mensaje: 'Email enviado exitosamente'
    }
  } catch (error) {
    logger.error('emailService', `Error enviando email via EmailJS`, { 
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
    const resultado = await enviarEmailViaEmailJS(emailCliente, nombreCliente, 'enriquecimiento', {
      tokenEnriquecimiento,
      origen
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'EmailJS falló, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Email no enviado automáticamente: ${error.message}. Formulario disponible vía link manual.`,
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
 * Envía email de propuesta a un cliente
 * @param {string} emailCliente - Email del cliente
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tokenPropuesta - Token único para la propuesta
 * @param {string} origen - URL base del sitio
 * @param {object} datosPropuesta - Datos de la propuesta (servicio, precio, etc.)
 */
export async function enviarEmailPropuesta(emailCliente, nombreCliente, tokenPropuesta, origen, datosPropuesta) {
  try {
    const resultado = await enviarEmailViaEmailJS(emailCliente, nombreCliente, 'propuesta', {
      tokenPropuesta,
      origen,
      ...datosPropuesta
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'EmailJS falló para propuesta, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Email no enviado automáticamente: ${error.message}. Formulario disponible vía link manual.`,
      linkManual: `${origen}/propuesta/${tokenPropuesta}`
    }
  }
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
    const resultado = await enviarEmailViaEmailJS(emailCliente, nombreCliente, 'pago', {
      tokenPago,
      origen,
      ...datosPago
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'EmailJS falló para pago, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Email no enviado automáticamente: ${error.message}. Formulario disponible vía link manual.`,
      linkManual: `${origen}/pago/${tokenPago}`
    }
  }
}

/**
 * Envía recordatorio de enriquecimiento
 */
export async function enviarRecordatorioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  try {
    const resultado = await enviarEmailViaEmailJS(emailCliente, nombreCliente, 'enriquecimiento', {
      tokenEnriquecimiento,
      origen,
      esRecordatorio: true
    })

    return resultado
  } catch (error) {
    logger.warn('emailService', 'EmailJS falló para recordatorio, usando link manual', { error: error.message })
    return { 
      success: false, 
      modo: 'link_manual',
      mensaje: `Email no enviado automáticamente: ${error.message}. Formulario disponible vía link manual.`,
      linkManual: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    }
  }
}

export default {
  enviarFormularioEnriquecimiento,
  generarTokenEnriquecimiento,
  validarTokenFormato,
  enviarRecordatorioEnriquecimiento,
  enviarEmailPropuesta,
  enviarEmailPago
}