/**
 * Servicio de email usando Resend
 * Permite enviar emails profesionales a los clientes
 */

import { logger } from './logger'

/**
 * Envía email de enriquecimiento de contacto
 * @param {string} emailCliente - Email del cliente (su Gmail)
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} tokenEnriquecimiento - Token único para el formulario
 * @param {string} origen - URL base del sitio
 */
export async function enviarFormularioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY
  const resendFromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  // Si no hay API key, usar modo simulación (permite que el sistema funcione)
  if (!resendApiKey) {
    logger.warn('emailService', 'RESEND_API_KEY no configurada, modo simulación')
    return { 
      success: false, 
      modo: 'simulacion',
      mensaje: 'Email no enviado (RESEND_API_KEY no configurada)',
      linkSimulado: `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    }
  }

  try {
    const linkEnriquecimiento = `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    
    // Template HTML profesional del email
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Completa tu perfil - Origen Spa & Bienestar</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #16231C 0%, #1F3026 100%);
            padding: 30px;
            text-align: center;
            color: #F3EEE2;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 500;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            color: #16231C;
            margin-bottom: 20px;
          }
          .message {
            color: #555;
            margin-bottom: 25px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: #C89B5C;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.3s ease;
          }
          .button:hover {
            background: #A87F45;
          }
          .info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
            font-size: 14px;
            color: #666;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #C89B5C;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Origen Spa & Bienestar</h1>
            <p>Belleza · Equilibrio · Tu mejor versión</p>
          </div>
          <div class="content">
            <p class="greeting">Hola ${nombreCliente},</p>
            <p class="message">
              Gracias por tu interés en Origen Spa & Bienestar. Para ofrecerte una experiencia 
              personalizada y adaptada a tus necesidades, necesitamos algunos datos adicionales.
            </p>
            <div class="button-container">
              <a href="${linkEnriquecimiento}" class="button">
                Completar mi perfil
              </a>
            </div>
            <div class="info">
              <strong>Este enlace expira en 7 días.</strong><br>
              El formulario tarda menos de 3 minutos en completarse.
            </div>
            <p class="message">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Origen Spa & Bienestar. Todos los derechos reservados.</p>
            <p>
              <a href="${origen}">Visitar nuestro sitio</a> | 
              <a href="${origen}/staff/leads">Área de staff</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Llamada a la API de Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: emailCliente,
        subject: 'Completa tu perfil para Origen Spa & Bienestar',
        html: htmlEmail
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error en API de Resend')
    }

    const result = await response.json()
    
    logger.info('emailService', 'Email enviado exitosamente', { 
      email: emailCliente, 
      id: result.id 
    })

    return { 
      success: true, 
      id: result.id,
      mensaje: 'Email enviado exitosamente'
    }
  } catch (error) {
    logger.error('emailService', 'Error enviando email', { error, email: emailCliente })
    // En caso de error, fallback a modo simulación con link manual
    return { 
      success: false, 
      modo: 'simulacion',
      mensaje: 'Email no enviado (error de conexión), pero el formulario está disponible',
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
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY
  const resendFromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!resendApiKey) {
    return { 
      success: false, 
      modo: 'simulacion',
      mensaje: 'Email no enviado (RESEND_API_KEY no configurada)',
      linkSimulado: `${origen}/pago/${tokenPago}`
    }
  }

  try {
    const linkPago = `${origen}/pago/${tokenPago}`
    const montoFormateado = `S/ ${datosPago.monto_total.toFixed(2)}`
    
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Completa tu pago - Origen Spa & Bienestar</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16231C 0%, #1F3026 100%); padding: 30px; text-align: center; color: #F3EEE2; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #C89B5C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Origen Spa & Bienestar</h1>
          <p>Belleza · Equilibrio · Tu mejor versión</p>
        </div>
        <div class="content">
          <p>Hola ${nombreCliente},</p>
          <p>¡Gracias por elegir Origen Spa & Bienestar! Tu servicio ha sido reservado.</p>
          <p><strong>Servicio:</strong> ${datosPago.servicio_contratado}</p>
          <p><strong>Total a pagar:</strong> ${montoFormateado}</p>
          <div style="text-align: center;">
            <a href="${linkPago}" class="button">Completar mi pago</a>
          </div>
        </div>
      </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: emailCliente,
        subject: `Completa tu pago - Origen Spa & Bienestar (${montoFormateado})`,
        html: htmlEmail
      })
    })

    if (!response.ok) {
      throw new Error('Error en API de Resend')
    }

    const result = await response.json()
    
    logger.info('emailService', 'Email de pago enviado exitosamente', { 
      email: emailCliente, 
      id: result.id 
    })

    return { 
      success: true, 
      id: result.id,
      mensaje: 'Email de pago enviado exitosamente'
    }
  } catch (error) {
    logger.error('emailService', 'Error enviando email de pago', { error, email: emailCliente })
    return { 
      success: false, 
      modo: 'simulacion',
      mensaje: 'Email no enviado (error de conexión)',
      linkManual: `${origen}/pago/${tokenPago}`
    }
  }
}

/**
 * Envía recordatorio de enriquecimiento
 */
export async function enviarRecordatorioEnriquecimiento(emailCliente, nombreCliente, tokenEnriquecimiento, origen) {
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY

  if (!resendApiKey) {
    return { 
      success: false, 
      modo: 'simulacion',
      mensaje: 'Recordatorio no enviado (RESEND_API_KEY no configurada)'
    }
  }

  try {
    const linkEnriquecimiento = `${origen}/enriquecimiento/${tokenEnriquecimiento}`
    
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recordatorio - Origen Spa & Bienestar</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16231C; padding: 20px; text-align: center; color: #F3EEE2; }
          .button { display: inline-block; background: #C89B5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Recordatorio</h2>
        </div>
        <div style="padding: 30px;">
          <p>Hola ${nombreCliente},</p>
          <p>Aún no has completado tu perfil. Te recordamos que el enlace expira pronto.</p>
          <a href="${linkEnriquecimiento}" class="button">Completar mi perfil ahora</a>
        </div>
      </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: emailCliente,
        subject: 'Recordatorio: Completa tu perfil para Origen Spa',
        html: htmlEmail
      })
    })

    if (!response.ok) {
      throw new Error('Error en API de Resend')
    }

    logger.info('emailService', 'Recordatorio enviado', { email: emailCliente })
    return { success: true, mensaje: 'Recordatorio enviado' }
  } catch (error) {
    logger.error('emailService', 'Error enviando recordatorio', { error })
    return { success: false, error: error.message }
  }
}

export default {
  enviarFormularioEnriquecimiento,
  generarTokenEnriquecimiento,
  validarTokenFormato,
  enviarRecordatorioEnriquecimiento,
  enviarEmailPago
}