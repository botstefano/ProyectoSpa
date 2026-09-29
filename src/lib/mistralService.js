/**
 * Servicio de integración con Mistral AI para chatbot de propuestas
 * Permite negociación interactiva de propuestas de servicios spa
 */

import { logger } from './logger'

/**
 * Catálogo completo de servicios de Origen Spa
 */
const ORIGEN_SPA_CATALOGO = {
  servicios: {
    faciales: [
      {
        id: 'facial-basico',
        nombre: 'Tratamiento Facial Básico',
        descripcion: 'Limpieza profunda, hidratación y protección solar',
        duracion: '60 min',
        precio_base: 80,
        precio_minimo: 60,
        descuento_maximo: 15,
        disponibilidad: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        horarios: ['9:00-12:00', '14:00-17:00', '17:00-20:00'],
        incluye: ['Limpieza profunda', 'Hidratación', 'Protector solar', 'Masaje facial breve'],
        requisitos: ['Piel sin irritaciones recientes', 'No haber recibido otros tratamientos faciales en 48h'],
        contraindicaciones: ['Piel muy sensible', 'Acné activo severo', 'Heridas abiertas']
      },
      {
        id: 'facial-antiaging',
        nombre: 'Tratamiento Facial Anti-Aging',
        descripcion: 'Tratamiento intensivo con ácidos y colágeno',
        duracion: '90 min',
        precio_base: 150,
        precio_minimo: 120,
        descuento_maximo: 10,
        disponibilidad: ['martes', 'jueves', 'sabado'],
        horarios: ['10:00-13:00', '15:00-18:00'],
        incluye: ['Análisis de piel', 'Peeling químico suave', 'Máscara de colágeno', 'Masaje reafirmante'],
        requisitos: ['Mayor de 25 años', 'Piel preparada (sin maquillaje)'],
        contraindicaciones: ['Piel muy sensible', 'Embarazo', 'Lactancia']
      },
      {
        id: 'facial-hidratante',
        nombre: 'Tratamiento Facial Hidratante Intensivo',
        descripcion: 'Hidratación profunda para pieles secas',
        duracion: '75 min',
        precio_base: 120,
        precio_minimo: 95,
        descuento_maximo: 12,
        disponibilidad: ['lunes', 'miercoles', 'viernes'],
        horarios: ['9:00-12:00', '14:00-17:00'],
        incluye: ['Exfoliación suave', 'Mascarilla hidratante', 'Sérum personalizado', 'Masaje relajante'],
        requisitos: ['Piel seca o deshidratada'],
        contraindicaciones: ['Piel grasa', 'Acné activo']
      }
    ],
    corporales: [
      {
        id: 'masaje-relajante',
        nombre: 'Masaje Relajante',
        descripcion: 'Masaje de cuerpo completo para liberar tensión',
        duracion: '60 min',
        precio_base: 100,
        precio_minimo: 80,
        descuento_maximo: 15,
        disponibilidad: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        horarios: ['9:00-12:00', '14:00-17:00', '17:00-20:00'],
        incluye: ['Masaje espalda', 'Masaje piernas', 'Masaje brazos', 'Masaje cuello y hombros'],
        requisitos: ['Sin contraindicaciones físicas'],
        contraindicaciones: ['Lesiones recientes', 'Embarazo (primer trimestre)', 'Problemas circulatorios severos']
      },
      {
        id: 'masaje-piedras',
        nombre: 'Masaje con Piedras Calientes',
        descripcion: 'Terapia con piedras volcánicas calientes',
        duracion: '90 min',
        precio_base: 180,
        precio_minimo: 150,
        descuento_maximo: 10,
        disponibilidad: ['martes', 'jueves', 'sabado'],
        horarios: ['10:00-13:00', '15:00-18:00'],
        incluye: ['Piedras calientes', 'Aceites esenciales', 'Masaje profundo', 'Relajación final'],
        requisitos: ['Tolerancia al calor', 'Sin problemas de circulación'],
        contraindicaciones: ['Diabetes', 'Problemas de sensibilidad', 'Embarazo']
      },
      {
        id: 'drenaje-linfatico',
        nombre: 'Drenaje Linfático',
        descripcion: 'Masaje específico para eliminar retención de líquidos',
        duracion: '60 min',
        precio_base: 130,
        precio_minimo: 110,
        descuento_maximo: 8,
        disponibilidad: ['lunes', 'miercoles', 'viernes'],
        horarios: ['9:00-12:00', '14:00-17:00'],
        incluye: ['Técnica de drenaje', 'Movimientos específicos', 'Mejora circulación'],
        requisitos: ['Sin problemas linfáticos conocidos'],
        contraindicaciones: ['Infecciones activas', 'Problemas cardíacos', 'Trombosis']
      }
    ],
    paquetes: [
      {
        id: 'paquete-relax',
        nombre: 'Paquete Relax Completo',
        descripcion: 'Facial + Masaje relajante + Hidroterapia',
        duracion: '3 horas',
        precio_base: 250,
        precio_minimo: 200,
        descuento_maximo: 12,
        disponibilidad: ['sabado'],
        horarios: ['10:00-13:00'],
        incluye: ['Tratamiento facial básico', 'Masaje relajante 60min', 'Hidroterapia 30min', 'Té y frutas'],
        requisitos: ['Disponibilidad de 3 horas', 'Sin contraindicaciones para ningún tratamiento'],
        ahorro_vs_individual: 60
      },
      {
        id: 'paquete-pareja',
        nombre: 'Paquete Pareja Romántica',
        descripcion: 'Experiencia para dos con tratamientos sincronizados',
        duracion: '2.5 horas',
        precio_base: 400,
        precio_minimo: 350,
        descuento_maximo: 10,
        disponibilidad: ['viernes', 'sabado'],
        horarios: ['15:00-17:30', '18:00-20:30'],
        incluye: ['Masaje pareja 60min', 'Facial pareja 45min', 'Champagne y chocolates', 'Ambiente romántico'],
        requisitos: ['Reserva para 2 personas', 'Anticipación mínima 48h'],
        ahorro_vs_individual: 80
      }
    ]
  },
  
  politicas: {
    descuentos: {
      maximo_porcentaje: 15,
      maximo_monto: 50,
      condiciones: {
        primera_visita: '10% de descuento',
        referido: '5% adicional',
        paquete_multiple: '15% en segundo servicio',
        dia_semana: '5% lunes-jueves'
      }
    },
    cancelaciones: {
      reembolso_completo: '48h antes',
      reembolso_parcial: '24h antes (50%)',
      sin_reembolso: 'menos de 24h'
    },
    pagos: {
      metodos: ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'],
      anticipo: '50% para reservar',
      saldo: '50% el día del servicio'
    },
    horarios: {
      apertura: '9:00',
      cierre: '20:00',
      dias_laborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
      domingo: 'cerrado'
    },
    ubicacion: {
      direccion: 'Trujillo, La Libertad',
      contacto: '+51 987 654 321',
      estacionamiento: 'gratuito'
    }
  },
  
  upselling: {
    servicios_complementarios: [
      { nombre: 'Aromaterapia premium', precio: 20, descripcion: 'Aceites esenciales de alta gama' },
      { nombre: 'Mascarilla de oro', precio: 50, descripcion: 'Tratamiento de lujo con partículas de oro' },
      { nombre: 'Chocolate therapy', precio: 30, descripcion: 'Tratamiento con cacao antioxidante' },
      { nombre: 'Bálsamo labial SPA', precio: 15, descripcion: 'Tratamiento de labios con hidratación intensa' }
    ],
    productos: [
      { nombre: 'Kit skincare básico', precio: 80, descripcion: 'Limpiador + tónico + hidratante' },
      { nombre: 'Sérum anti-edad', precio: 120, descripcion: 'Sérum con ingredientes premium' },
      { nombre: 'Protector solar mineral', precio: 45, descripcion: 'FPS 50+ natural' }
    ]
  }
}

/**
 * Valida si una solicitud es razonable según el catálogo
 */
function validarSolicitud(solicitud, propuestaActual) {
  const servicio = ORIGEN_SPA_CATALOGO.servicios
  
  // Buscar el servicio en el catálogo de forma flexible
  let servicioEncontrado = null
  const propuestaNombre = (propuestaActual?.servicio || '').toLowerCase()
  for (const categoria in servicio) {
    const encontrado = servicio[categoria].find(s => 
      s.id === propuestaActual?.servicio_id || 
      propuestaNombre.includes(s.nombre.toLowerCase()) ||
      s.nombre.toLowerCase().includes(propuestaNombre)
    )
    if (encontrado) {
      servicioEncontrado = encontrado
      break
    }
  }
  
  if (!servicioEncontrado) {
    const precioBase = Number(propuestaActual?.precio) || 120
    servicioEncontrado = {
      nombre: propuestaActual?.servicio || 'Tratamiento Spa',
      precio_base: precioBase,
      precio_minimo: Math.max(50, Math.round(precioBase * 0.7)),
      descuento_maximo: 15,
      disponibilidad: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    }
  }
  
  // Validar precio mínimo
  if (solicitud.precio && solicitud.precio < servicioEncontrado.precio_minimo) {
    return { 
      valida: false, 
      razon: `El precio mínimo para ${servicioEncontrado.nombre} es S/ ${servicioEncontrado.precio_minimo}`,
      precio_minimo: servicioEncontrado.precio_minimo
    }
  }
  
  // Validar descuento máximo
  if (solicitud.descuento && parseInt(solicitud.descuento) > servicioEncontrado.descuento_maximo) {
    return { 
      valida: false, 
      razon: `El descuento máximo para ${servicioEncontrado.nombre} es ${servicioEncontrado.descuento_maximo}%`,
      descuento_maximo: servicioEncontrado.descuento_maximo
    }
  }
  
  // Validar disponibilidad
  if (solicitud.dia && !servicioEncontrado.disponibilidad.includes(solicitud.dia.toLowerCase())) {
    return { 
      valida: false, 
      razon: `${servicioEncontrado.nombre} solo está disponible: ${servicioEncontrado.disponibilidad.join(', ')}`,
      disponibilidad: servicioEncontrado.disponibilidad
    }
  }
  
  return { valida: true, servicio: servicioEncontrado }
}

let mistralCooldownUntil = 0

function isRealMistralKey(key) {
  if (!key || typeof key !== 'string') return false
  const trimmed = key.trim()
  if (!trimmed || trimmed.startsWith('TU-') || trimmed.includes('MISTRAL-API-KEY') || trimmed.includes('YOUR_')) return false
  return true
}

/**
 * Enviar mensaje a Mistral AI
 * @param {string} message - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de conversación
 * @param {Object} currentProposal - Propuesta actual para contexto
 * @param {string} apiKey - API key de Mistral
 */
export async function sendMessageToMistral(message, conversationHistory = [], currentProposal = {}, apiKey) {
  // Si no hay API key real configurada, usar el asistente inteligente spa de contingencia
  if (!isRealMistralKey(apiKey)) {
    return simulateMistralResponse(message, currentProposal)
  }

  // Si Mistral está en cooldown por rate limit (429), responder de inmediato con el asistente spa
  if (Date.now() < mistralCooldownUntil) {
    return simulateMistralResponse(message, currentProposal)
  }

  try {
    const validacion = validarSolicitud({ mensaje: message }, currentProposal)
    const systemPrompt = buildSystemPrompt(currentProposal)
    
    const recentHistory = conversationHistory.slice(-4)
    const transformedHistory = recentHistory.map(msg => ({
      role: (msg.rol === 'assistant' || msg.role === 'assistant') ? 'assistant' : 'user',
      content: msg.mensaje || msg.content || ''
    })).filter(m => m.content)

    const messages = [
      { role: 'system', content: systemPrompt },
      ...transformedHistory,
      { role: 'user', content: message }
    ]

    // Probar primero open-mistral-7b (modelo admitido en cuentas gratuitas), luego mistral-small-latest
    const modelsToTry = ['open-mistral-7b', 'mistral-small-latest']
    let lastError = null

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 450
          })
        })

        if (response.status === 429) {
          logger.warn('mistralService', 'Rate limit en Mistral (429); activando asistente spa local sin esperas.')
          // Cooldown de 60s para no saturar la API ni ralentizar la UI
          mistralCooldownUntil = Date.now() + 60000
          return simulateMistralResponse(message, currentProposal)
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          lastError = new Error(`Mistral API (${response.status}): ${errorText || response.statusText}`)
          continue
        }

        const result = await response.json()
        
        if (!result.choices || !result.choices[0] || !result.choices[0].message) {
          throw new Error('Respuesta de Mistral no tiene el formato esperado')
        }

        let aiMessage = result.choices[0].message.content || ''

        // Procesar la respuesta para detectar cambios en la propuesta
        const proposalChanges = extractProposalChanges(aiMessage, currentProposal)

        // Limpiar etiqueta de control [ACTUALIZACION: ...] para no mostrarla textualmente al cliente
        aiMessage = aiMessage.replace(/\[ACTUALIZACION:[^\]]+\]/gi, '').trim()

        return {
          success: true,
          message: aiMessage,
          proposalChanges: proposalChanges,
          validacion: validacion,
          rawResponse: result
        }
      } catch (innerErr) {
        lastError = innerErr
      }
    }
    
    if (lastError) {
      logger.warn('mistralService', 'Aviso comunicando con Mistral, activando asistente spa:', { 
        error: lastError.message 
      })
    }
    return simulateMistralResponse(message, currentProposal)
  } catch (error) {
    logger.warn('mistralService', 'Aviso comunicando con Mistral, activando asistente spa:', { 
      error: error.message 
    })
    return simulateMistralResponse(message, currentProposal)
  }
}

/**
 * Construir el prompt del sistema con contexto completo del negocio
 */
function buildSystemPrompt(currentProposal) {
  const serviciosNombres = Object.keys(ORIGEN_SPA_CATALOGO.servicios).join(', ')
  
  return `Eres asistente virtual de Origen Spa en Trujillo, Perú. Ayuda amablemente a los clientes a negociar y resolver dudas sobre su propuesta de spa.

SERVICIOS DISPONIBLES: ${serviciosNombres}
POLÍTICAS:
- Descuentos: máximo 15% de descuento sobre el precio base.
- Métodos de pago: Efectivo, Tarjeta, Transferencia, Yape y Plin.
- Horarios: Lunes a Sábado de 9:00 AM a 8:00 PM. Domingos cerrado.
- Ubicación: Trujillo, La Libertad.

PROPUESTA ACTUAL DEL CLIENTE:
- Servicio: ${currentProposal?.servicio || 'Tratamiento Spa'}
- Precio actual: S/ ${currentProposal?.precio || '120'}
- Duración: ${currentProposal?.duracion || '60 min'}
- Descuento actual: ${currentProposal?.descuento || '0%'}
- Incluye: ${currentProposal?.incluye || 'Tratamiento completo'}

INSTRUCCIONES CLAVE:
1. Responde en español con tono cálido, profesional y conciso.
2. Si el cliente pide una rebaja o descuento, puedes ofrecer hasta un 10% o 15% máximo.
3. Si acuerdas un nuevo precio o cambio de fecha/horario, explica el beneficio amablemente.
4. OBLIGATORIO: Si acuerdas una modificación de precio, descuento, fecha u horario, añade al final de tu mensaje una etiqueta con este formato exacto:
[ACTUALIZACION: precio=S/ 108, descuento=10%]
5. Si el cliente dice que acepta la propuesta o está de acuerdo, felicítalo y recuérdale hacer clic en el botón "Confirmar Propuesta".`
}

/**
 * Extraer cambios en la propuesta desde la respuesta de la IA
 */
function extractProposalChanges(aiMessage, _currentProposal) {
  const changes = {}
  
  // 1. Buscar etiqueta estructurada [ACTUALIZACION: precio=..., descuento=...]
  const structuredMatch = aiMessage.match(/\[ACTUALIZACION:\s*([^\]]+)\]/i)
  if (structuredMatch) {
    const content = structuredMatch[1]
    const precioMatch = content.match(/precio[:=]\s*(?:S\/\s*)?(\d+(?:\.\d{2})?)/i)
    if (precioMatch) changes.precio = parseFloat(precioMatch[1])

    const descMatch = content.match(/descuento[:=]\s*(\d{1,2})%?/i)
    if (descMatch) changes.descuento = `${Math.min(15, parseInt(descMatch[1]))}%`

    const durMatch = content.match(/duraci[oó]n[:=]\s*(\d+\s*(?:min|horas?))/i)
    if (durMatch) changes.duracion = durMatch[1]

    const fechaMatch = content.match(/fecha[:=]\s*([^,;\]]+)/i)
    if (fechaMatch) changes.fecha = fechaMatch[1].trim()

    const horarioMatch = content.match(/horario[:=]\s*([^,;\]]+)/i)
    if (horarioMatch) changes.horario = horarioMatch[1].trim()
  }

  // 2. Patrones naturales si no hubo etiqueta estructurada
  if (Object.keys(changes).length === 0) {
    const precioPattern = /(?:nuevo precio|precio final|costo|dejarlo en|total)[:\s]+(?:de\s+)?(?:S\/\s*)?(\d+(?:\.\d{2})?)/i
    const precioMatch = aiMessage.match(precioPattern)
    if (precioMatch && precioMatch[1]) {
      const p = parseFloat(precioMatch[1])
      if (p > 30 && p < 1000) {
        changes.precio = p
      }
    }

    const descPattern = /(\d{1,2})%\s*(?:de\s+)?descuento/i
    const descMatch = aiMessage.match(descPattern)
    if (descMatch && descMatch[1]) {
      changes.descuento = `${Math.min(15, parseInt(descMatch[1]))}%`
    }
  }

  if (Object.keys(changes).length > 0) {
    logger.info('mistralService', 'Cambios detectados en propuesta', { changes })
    return changes
  }

  return null
}

/**
 * Aplicar cambios a la propuesta
 */
export function applyProposalChanges(currentProposal, changes) {
  if (!changes) return currentProposal

  const updatedProposal = { ...currentProposal }

  if (changes.precio !== undefined) {
    const num = typeof changes.precio === 'number' 
      ? changes.precio 
      : parseFloat(String(changes.precio).replace(/[^\d.]/g, ''))
    if (!isNaN(num) && num > 0) {
      updatedProposal.precio = num
    }
  }

  if (changes.descuento !== undefined) {
    const num = parseInt(String(changes.descuento).replace(/[^\d]/g, ''))
    if (!isNaN(num)) {
      updatedProposal.descuento = `${Math.min(15, num)}%`
    }
  }

  if (changes.duracion) {
    updatedProposal.duracion = String(changes.duracion).trim()
  }

  if (changes.fecha) {
    updatedProposal.fecha = String(changes.fecha).trim()
  }

  if (changes.horario) {
    updatedProposal.horario = String(changes.horario).trim()
  }

  return updatedProposal
}

/**
 * Simular respuesta inteligente (modo sin API key o contingencia por límite de cuota)
 */
function simulateMistralResponse(message, currentProposal) {
  const lowerMessage = message.toLowerCase()
  const precioBase = Number(currentProposal?.precio) || 120
  const servicioActual = currentProposal?.servicio || 'Tratamiento Spa'

  // 1. Confirmación / Aceptación
  if (
    lowerMessage.includes('acepto') ||
    lowerMessage.includes('confirmar') ||
    lowerMessage.includes('confirmo') ||
    lowerMessage.includes('de acuerdo') ||
    lowerMessage.includes('me gusta') ||
    lowerMessage.includes('me parece bien') ||
    lowerMessage.includes('lo tomo') ||
    lowerMessage.includes('dale') ||
    lowerMessage.includes('listo') ||
    lowerMessage.includes('perfecto') ||
    lowerMessage.includes('agendar') ||
    lowerMessage.includes('sí quiero') ||
    lowerMessage.includes('si quiero')
  ) {
    return {
      success: true,
      message: `¡Excelente decisión! Tu propuesta para "${servicioActual}" por S/ ${currentProposal?.precio || precioBase} está lista para ser formalizada. Para asegurar tu turno en Origen Spa Trujillo, por favor haz clic en el botón verde "✅ Confirmar Propuesta". Al confirmar, podrás elegir tu medio de pago (Yape, Plin, Tarjeta o Transferencia).`,
      proposalChanges: null,
      confirmar: true,
      modo: 'asistente_origen'
    }
  }

  // 2. Oferta de precio específico (ej. "a 80 soles", "puedo pagar 90", "te doy 100", "80")
  const precioMatch = lowerMessage.match(/(?:s\/\.?\s*|soles\s*|a\s+|pago\s+|tengo\s+|ofrezco\s+|dejarlo en\s+)?(\d{2,3})(?:\s*soles|\s*so|\s*s\/)?/)
  const numeroDetectado = precioMatch ? parseInt(precioMatch[1], 10) : null

  if (
    numeroDetectado &&
    numeroDetectado >= 40 &&
    numeroDetectado <= 400 &&
    (lowerMessage.includes('soles') || lowerMessage.includes('s/') || lowerMessage.includes('pago') || lowerMessage.includes('tengo') || lowerMessage.includes('dejarlo') || lowerMessage.includes('ofrezco') || lowerMessage.includes('precio'))
  ) {
    // Si la oferta es >= 65 soles o dentro de un rango viable
    if (numeroDetectado >= 65 && numeroDetectado < precioBase) {
      const ahorro = precioBase - numeroDetectado
      const pct = Math.round((ahorro / precioBase) * 100)
      return {
        success: true,
        message: `¡Trato hecho! Como queremos brindarte la mejor experiencia en Origen Spa, aceptamos tu propuesta de S/ ${numeroDetectado} (${pct}% de descuento promocional, ahorras S/ ${ahorro}). Hemos actualizado la tarjeta de propuesta en pantalla. ¿Te parece bien esta tarifa para confirmar?`,
        proposalChanges: { precio: numeroDetectado, descuento: `${pct}%` },
        confirmar: false,
        modo: 'asistente_origen'
      }
    } else if (numeroDetectado < 65) {
      const precioMinimoPosible = 70
      return {
        success: true,
        message: `Por la calidad de los productos orgánicos y la exclusividad del protocolo de cabina privada, lo mínimo que podemos ofrecerte es S/ ${precioMinimoPosible} para ${servicioActual}. Es un precio promocional único. ¿Te gustaría aprovecharlo?`,
        proposalChanges: { precio: precioMinimoPosible, descuento: '25%' },
        confirmar: false,
        modo: 'asistente_origen'
      }
    }
  }

  // 3. Negociación general de descuento o precio elevado
  if (
    lowerMessage.includes('precio') ||
    lowerMessage.includes('caro') ||
    lowerMessage.includes('descuento') ||
    lowerMessage.includes('rebaja') ||
    lowerMessage.includes('menos') ||
    lowerMessage.includes('promoción') ||
    lowerMessage.includes('promocion') ||
    lowerMessage.includes('oferta') ||
    lowerMessage.includes('estudiante')
  ) {
    const precioConDescuento = Math.round(precioBase * 0.85) // 15% descuento
    const ahorro = precioBase - precioConDescuento
    return {
      success: true,
      message: `¡Comprendo perfectamente! En Origen Spa queremos que disfrutes de tu momento de bienestar, por lo que te aplicamos un 15% de descuento de cortesía. Tu nuevo precio queda en S/ ${precioConDescuento} (ahorras S/ ${ahorro}). La propuesta ya se actualizó en pantalla. ¿Te gustaría confirmar con este beneficio?`,
      proposalChanges: { descuento: '15%', precio: precioConDescuento },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // 4. Solicitud de cambio de servicio
  if (lowerMessage.includes('descontracturante') || lowerMessage.includes('cuello') || lowerMessage.includes('espalda') || lowerMessage.includes('contractura')) {
    return {
      success: true,
      message: `¡Excelente elección! El Masaje Descontracturante es ideal para liberar tensiones en espalda, cuello y zona lumbar con aceites calientes de eucalipto. Hemos ajustado tu propuesta a "Masaje Descontracturante" por S/ 100 (60 min). ¿Te gustaría este tratamiento?`,
      proposalChanges: {
        servicio: 'Masaje Descontracturante',
        precio: 100,
        precioRegular: 130,
        duracion: '60 min',
        incluye: 'Masaje profundo, aceite de eucalipto, compresas herbales calientes'
      },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  if (lowerMessage.includes('piedras') || lowerMessage.includes('volcánica') || lowerMessage.includes('volcanica')) {
    return {
      success: true,
      message: `¡El Masaje con Piedras Calientes es nuestra experiencia más placentera! Combina piedras volcánicas a temperatura terapéutica con aromaterapia de sándalo. Hemos actualizado tu propuesta por S/ 140 (75 min). ¿Qué te parece?`,
      proposalChanges: {
        servicio: 'Masaje con Piedras Calientes',
        precio: 140,
        precioRegular: 170,
        duracion: '75 min',
        incluye: 'Terapia con piedras volcánicas, aceites esenciales y reflexología express'
      },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  if (lowerMessage.includes('anti-aging') || lowerMessage.includes('antiaging') || lowerMessage.includes('arruga') || lowerMessage.includes('colágeno') || lowerMessage.includes('colageno')) {
    return {
      success: true,
      message: `El Tratamiento Facial Anti-Aging utiliza ácido hialurónico concentrado y colágeno marino para reafirmar y revitalizar la piel. Hemos actualizado tu propuesta por S/ 130 (90 min). ¿Te gustaría agendar este tratamiento?`,
      proposalChanges: {
        servicio: 'Tratamiento Facial Anti-Aging',
        precio: 130,
        precioRegular: 160,
        duracion: '90 min',
        incluye: 'Limpieza profunda, ácido hialurónico, colágeno marino y máscara LED tensora'
      },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  if (lowerMessage.includes('envoltura') || lowerMessage.includes('exfoliación') || lowerMessage.includes('exfoliacion') || lowerMessage.includes('corporal')) {
    return {
      success: true,
      message: `La Envoltura y Exfoliación Corporal renueva la textura de toda tu piel con sales minerales y barro volcánico desintoxicante. Hemos configurado tu propuesta en S/ 120 (75 min). ¿Te gustaría probarla?`,
      proposalChanges: {
        servicio: 'Envoltura y Exfoliación Corporal',
        precio: 120,
        precioRegular: 150,
        duracion: '75 min',
        incluye: 'Exfoliación con sales minerales, envoltura desintoxicante e hidratación con manteca de karité'
      },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  if (lowerMessage.includes('relajante') || lowerMessage.includes('relajacion') || lowerMessage.includes('estrés') || lowerMessage.includes('estres')) {
    return {
      success: true,
      message: `El Masaje Relajante es perfecto para desconectar de la rutina diaria con aromaterapia de lavanda y maniobras suaves en todo el cuerpo. Hemos actualizado tu propuesta a S/ 80 (60 min). ¿Te parece bien?`,
      proposalChanges: {
        servicio: 'Masaje Relajante',
        precio: 80,
        precioRegular: 100,
        duracion: '60 min',
        incluye: 'Aromaterapia de lavanda, masaje corporal relajante y té de hierbas al finalizar'
      },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // 5. Horarios, días y disponibilidad
  if (
    lowerMessage.includes('fecha') ||
    lowerMessage.includes('horario') ||
    lowerMessage.includes('hora') ||
    lowerMessage.includes('dia') ||
    lowerMessage.includes('día') ||
    lowerMessage.includes('días') ||
    lowerMessage.includes('cuándo') ||
    lowerMessage.includes('cuando') ||
    lowerMessage.includes('sábado') ||
    lowerMessage.includes('sabado') ||
    lowerMessage.includes('lunes') ||
    lowerMessage.includes('martes') ||
    lowerMessage.includes('miércoles') ||
    lowerMessage.includes('miercoles') ||
    lowerMessage.includes('jueves') ||
    lowerMessage.includes('viernes') ||
    lowerMessage.includes('mañana') ||
    lowerMessage.includes('tarde')
  ) {
    let horarioDetectado = 'Horario flexible a coordinar'
    if (lowerMessage.includes('sábado') || lowerMessage.includes('sabado')) {
      horarioDetectado = 'Sábados (turnos disponibles 10:00 AM, 3:00 PM o 5:00 PM)'
    } else if (lowerMessage.includes('mañana') || lowerMessage.includes('manana')) {
      horarioDetectado = 'Turno Mañana (entre 9:00 AM y 12:00 PM)'
    } else if (lowerMessage.includes('tarde') || lowerMessage.includes('noche')) {
      horarioDetectado = 'Turno Tarde (entre 2:00 PM y 7:00 PM)'
    }

    return {
      success: true,
      message: `En Origen Spa atendemos de lunes a sábado de 9:00 AM a 8:00 PM en Trujillo (domingos cerrado para mantenimiento). Disponemos de turnos matutinos (9am - 12pm) y turnos tarde (2pm - 7pm). Hemos tomado nota de tu preferencia: "${horarioDetectado}". ¿Deseas confirmar la propuesta para reservar ese horario?`,
      proposalChanges: { horario: horarioDetectado },
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // 6. Ubicación / Dirección en Trujillo
  if (
    lowerMessage.includes('dónde') ||
    lowerMessage.includes('donde') ||
    lowerMessage.includes('dirección') ||
    lowerMessage.includes('direccion') ||
    lowerMessage.includes('ubicación') ||
    lowerMessage.includes('ubicacion') ||
    lowerMessage.includes('queda') ||
    lowerMessage.includes('llegar')
  ) {
    return {
      success: true,
      message: `Nos ubicamos en Calle Las Orquídeas 245, Urb. El Golf, Trujillo (a una cuadra del parque principal). Contamos con estacionamiento reservado y áreas privadas climatizadas. Atendemos previa cita de Lunes a Sábado de 9:00 AM a 8:00 PM. ¿Te gustaría agendar tu visita?`,
      proposalChanges: null,
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // 7. Medios de pago
  if (
    lowerMessage.includes('pago') ||
    lowerMessage.includes('pagar') ||
    lowerMessage.includes('tarjeta') ||
    lowerMessage.includes('yape') ||
    lowerMessage.includes('plin') ||
    lowerMessage.includes('transferencia') ||
    lowerMessage.includes('efectivo') ||
    lowerMessage.includes('cuotas')
  ) {
    return {
      success: true,
      message: `Aceptamos Yape, Plin, tarjetas de crédito/débito (Visa, Mastercard, Diners, Amex), transferencias BCP/BBVA y pago en efectivo al llegar. Al confirmar la propuesta se habilitará tu enlace seguro de pago donde podrás elegir pagar al contado o en 2 cuotas. ¿Tienes alguna otra consulta sobre el servicio?`,
      proposalChanges: null,
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // 8. Qué incluye / beneficios
  if (
    lowerMessage.includes('incluye') ||
    lowerMessage.includes('tratamiento') ||
    lowerMessage.includes('qué hace') ||
    lowerMessage.includes('que hace') ||
    lowerMessage.includes('beneficio') ||
    lowerMessage.includes('pasos')
  ) {
    return {
      success: true,
      message: `Tu propuesta para "${servicioActual}" incluye: ${currentProposal?.incluye || 'evaluación dérmica inicial, protocolo completo con insumos orgánicos, masaje terapéutico y sesión relajante'} con una duración de ${currentProposal?.duracion || '60 min'}. Todo el servicio es ejecutado por terapeutas certificadas en cabina individual. ¿Deseas que te reservemos un cupo?`,
      proposalChanges: null,
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // 9. Saludos / cortesía
  if (
    lowerMessage.includes('hola') ||
    lowerMessage.includes('buenas') ||
    lowerMessage.includes('buenos días') ||
    lowerMessage.includes('buenos dias') ||
    lowerMessage.includes('buenas tardes') ||
    lowerMessage.includes('buenas noches') ||
    lowerMessage.includes('que tal') ||
    lowerMessage.includes('qué tal')
  ) {
    return {
      success: true,
      message: `¡Hola! Qué gusto saludarte. Soy tu asesora virtual de Origen Spa. He preparado tu propuesta para "${servicioActual}" a S/ ${currentProposal?.precio || precioBase}. Puedo ayudarte a ajustar el precio, cambiar de tratamiento, coordinar tu horario en Trujillo o resolver cualquier duda. ¿En qué te puedo ayudar hoy?`,
      proposalChanges: null,
      confirmar: false,
      modo: 'asistente_origen'
    }
  }

  // Fallback conversacional
  return {
    success: true,
    message: `¡Hola! Estoy aquí para asegurarme de que recibas el mejor cuidado en Origen Spa Trujillo. Respecto a tu propuesta de "${servicioActual}" (S/ ${currentProposal?.precio || precioBase}), podemos coordinar tu día de atención, resolver dudas sobre el protocolo o evaluar una tarifa especial. ¿Qué te gustaría consultar?`,
    proposalChanges: null,
    confirmar: false,
    modo: 'asistente_origen'
  }
}

/**
 * Generar token único para propuesta
 */
export function generarTokenPropuesta() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `PROP-${timestamp}-${random}`.toUpperCase()
}

/**
 * Validar formato de token
 */
export function validarTokenPropuesta(token) {
  if (!token || typeof token !== 'string') return false
  return token.startsWith('PROP-') && token.length >= 10
}

export default {
  sendMessageToMistral,
  applyProposalChanges,
  generarTokenPropuesta,
  validarTokenPropuesta
}