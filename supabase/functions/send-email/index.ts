import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Configurar CORS headers para preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const body = await req.json()
    console.log('Request received:', body)

    const { emailCliente, nombreCliente, tipoEmail, datos } = body

    if (!emailCliente || !nombreCliente || !tipoEmail) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obtener API key de Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY no configurada')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada en Edge Function' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar datos del email según el tipo
    let subject, html, fromEmail = 'onboarding@resend.dev'

    if (tipoEmail === 'enriquecimiento') {
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
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16231C 0%, #1F3026 100%); padding: 30px; text-align: center; color: #F3EEE2; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Origen Spa & Bienestar</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Belleza · Equilibrio · Tu mejor versión</p>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #16231C; margin-bottom: 20px;">Hola ${nombreCliente},</p>
            <p style="color: #555; margin-bottom: 25px;">
              Gracias por tu interés en Origen Spa & Bienestar. Para ofrecerte una experiencia 
              personalizada y adaptada a tus necesidades, necesitamos algunos datos adicionales.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkEnriquecimiento}" style="display: inline-block; background: #C89B5C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600;">
                Completar mi perfil
              </a>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; font-size: 14px; color: #666;">
              <strong>Este enlace expira en 7 días.</strong><br>
              El formulario tarda menos de 3 minutos en completarse.
            </div>
          </div>
        </body>
        </html>
      `
    } else if (tipoEmail === 'pago') {
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
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16231C 0%, #1F3026 100%); padding: 30px; text-align: center; color: #F3EEE2; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Origen Spa & Bienestar</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Belleza · Equilibrio · Tu mejor versión</p>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="color: #16231C;">Hola ${nombreCliente},</p>
            <p style="color: #555;">¡Gracias por elegir Origen Spa & Bienestar! Tu servicio ha sido reservado.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #C89B5C;">
              <h3 style="margin: 0 0 15px 0; color: #16231C;">Detalles del pago</h3>
              <p style="margin: 10px 0;"><strong>Servicio:</strong> ${servicio}</p>
              <p style="margin: 10px 0;"><strong>Total a pagar:</strong> ${montoFormateado}</p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${linkPago}" style="display: inline-block; background: #C89B5C; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600;">
                Completar mi pago
              </a>
            </div>
          </div>
        </body>
        </html>
      `
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de email no válido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Llamada a la API de Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: emailCliente,
        subject: subject,
        html: html
      })
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Error en API de Resend:', errorData)
      throw new Error(errorData.message || 'Error en API de Resend')
    }

    const result = await resendResponse.json()
    console.log('Email enviado exitosamente:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: result.id,
        mensaje: 'Email enviado exitosamente'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en Edge Function:', error)
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