import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  // Configurar CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { emailCliente, nombreCliente, tipoEmail, datos } = await req.json()

    if (!emailCliente || !nombreCliente || !tipoEmail) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let subject, html, fromEmail = 'onboarding@resend.dev'

    switch (tipoEmail) {
      case 'enriquecimiento':
        const tokenEnriquecimiento = datos?.tokenEnriquecimiento
        const origen = datos?.origen || 'https://origen-spa.onrender.com'
        const linkEnriquecimiento = `${origen}/enriquecimiento/${tokenEnriquecimiento}`
        
        subject = 'Completa tu perfil - Origen Spa & Bienestar'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Completa tu perfil - Origen Spa & Bienestar</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #16231C 0%, #1F3026 100%); padding: 30px; text-align: center; color: #F3EEE2; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 500; letter-spacing: -0.5px; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
              .content { padding: 30px; }
              .greeting { font-size: 18px; color: #16231C; margin-bottom: 20px; }
              .message { color: #555; margin-bottom: 25px; }
              .button-container { text-align: center; margin: 30px 0; }
              .button { display: inline-block; background: #C89B5C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 16px; transition: background 0.3s ease; }
              .button:hover { background: #A87F45; }
              .info { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; font-size: 14px; color: #666; }
              .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
              .footer a { color: #C89B5C; text-decoration: none; }
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
        break

      case 'pago':
        const tokenPago = datos?.tokenPago
        const origenPago = datos?.origen || 'https://origen-spa.onrender.com'
        const linkPago = `${origenPago}/pago/${tokenPago}`
        const montoTotal = datos?.monto_total || 0
        const servicio = datos?.servicio_contratado || 'Servicio'
        const montoFormateado = `S/ ${montoTotal.toFixed(2)}`
        
        subject = `Completa tu pago - Origen Spa & Bienestar (${montoFormateado})`
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Completa tu pago - Origen Spa & Bienestar</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #16231C 0%, #1F3026 100%); padding: 30px; text-align: center; color: #F3EEE2; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 500; letter-spacing: -0.5px; }
              .content { padding: 30px; }
              .payment-details { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #C89B5C; }
              .button { display: inline-block; background: #C89B5C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
              .info { background: #fff3cd; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #ffc107; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Origen Spa & Bienestar</h1>
                <p>Belleza · Equilibrio · Tu mejor versión</p>
              </div>
              <div class="content">
                <p>Hola ${nombreCliente},</p>
                <p>¡Gracias por elegir Origen Spa & Bienestar! Tu servicio ha sido reservado.</p>
                <div class="payment-details">
                  <h3>Detalles del pago</h3>
                  <p><strong>Servicio:</strong> ${servicio}</p>
                  <p><strong>Total a pagar:</strong> ${montoFormateado}</p>
                </div>
                <div style="text-align: center;">
                  <a href="${linkPago}" class="button">Completar mi pago</a>
                </div>
                <div class="info">
                  <strong>⚠ Este enlace expira en 7 días.</strong>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de email no válido' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to: emailCliente,
      subject: subject,
      html: html,
    })

    console.log('Email enviado exitosamente:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        mensaje: 'Email enviado exitosamente'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error enviando email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})