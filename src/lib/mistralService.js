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
  const politicas = ORIGEN_SPA_CATALOGO.politicas
  
  // Buscar el servicio en el catálogo
  let servicioEncontrado = null
  for (const categoria in servicio) {
    const encontrado = servicio[categoria].find(s => 
      s.id === propuestaActual?.servicio_id || 
      s.nombre.toLowerCase().includes((propuestaActual?.servicio || '').toLowerCase())
    )
    if (encontrado) {
      servicioEncontrado = encontrado
      break
    }
  }
  
  if (!servicioEncontrado) {
    return { valida: false, razon: 'Servicio no encontrado en catálogo' }
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

/**
 * Enviar mensaje a Mistral AI
 * @param {string} message - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de conversación
 * @param {Object} currentProposal - Propuesta actual para contexto
 * @param {string} apiKey - API key de Mistral
 */
export async function sendMessageToMistral(message, conversationHistory = [], currentProposal = {}, apiKey) {
  if (!apiKey) {
    logger.warn('mistralService', 'MISTRAL_API_KEY no configurada, usando modo simulación')
    return simulateMistralResponse(message, currentProposal)
  }

  try {
    // Validar solicitud contra el catálogo antes de enviar a Mistral
    const validacion = validarSolicitud({ mensaje: message }, currentProposal)
    
    // Construir el contexto del sistema con el catálogo completo
    const systemPrompt = buildSystemPrompt(currentProposal)
    
    // Construir el array de mensajes para Mistral
    // Transformar el historial de conversación del formato español al formato de Mistral
    // Limitar drásticamente a los últimos 3 mensajes para evitar rate limits
    const recentHistory = conversationHistory.slice(-3)
    const transformedHistory = recentHistory.map(msg => ({
      role: msg.rol || msg.role,
      content: msg.mensaje || msg.content
    }))

    const messages = [
      { role: 'system', content: systemPrompt },
      ...transformedHistory,
      { role: 'user', content: message }
    ]

    logger.info('mistralService', 'Enviando solicitud a Mistral AI', { 
      messageLength: message.length,
      hasConversationHistory: conversationHistory.length > 0
    })

    // Llamada a la API de Mistral con reintentos reducidos para evitar gastar créditos
    let retries = 0
    const maxRetries = 1 // Reducir a 1 reintento para no gastar créditos
    let lastError = null

    while (retries < maxRetries) {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest', // Modelo optimizado para costo/rendimiento
        messages: messages,
        temperature: 0.7, // Creatividad moderada para negociación
        max_tokens: 500
      })
    })

      // Manejo específico de rate limit (429)
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({ message: 'Rate limit exceeded' }))
        logger.warn('mistralService', 'Rate limit de Mistral, reintentando...', { 
          retry: retries + 1,
          maxRetries: maxRetries,
          errorData: errorData 
        })
        
        // Esperar con backoff exponencial: 3s (solo un reintento)
        const waitTime = 3000
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        retries++
        lastError = new Error(`Mistral API (429): Rate limit exceeded`)
        continue // Reintentar
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido en API de Mistral' }))
        const errorMessage = errorData.message || errorData.error?.message || 'Error en API de Mistral'
        logger.error('mistralService', 'Error en respuesta de Mistral', { 
          status: response.status,
          statusText: response.statusText,
          errorData: errorData 
        })
        throw new Error(`Mistral API (${response.status}): ${errorMessage}`)
      }

    const result = await response.json()
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Respuesta de Mistral no tiene el formato esperado')
    }

    const aiMessage = result.choices[0].message.content

    logger.info('mistralService', 'Mensaje enviado a Mistral exitosamente', { 
      messageLength: message.length,
      responseLength: aiMessage.length,
      validacion: validacion,
      retries: retries
    })

    // Procesar la respuesta para detectar cambios en la propuesta
    const proposalChanges = extractProposalChanges(aiMessage, currentProposal)

    return {
      success: true,
      message: aiMessage,
      proposalChanges: proposalChanges,
      validacion: validacion,
      rawResponse: result
    }
    }
    
    // Si todos los reintentos fallaron por rate limit
    if (lastError) {
      throw lastError
    }
  } catch (error) {
    logger.error('mistralService', 'Error comunicando con Mistral', { 
      error: error.message,
      stack: error.stack 
    })
    
    // Usar modo simulación como fallback
    logger.warn('mistralService', 'Usando modo simulación como fallback')
    return simulateMistralResponse(message, currentProposal)
  }
}

/**
 * Construir el prompt del sistema con contexto completo del negocio
 */
function buildSystemPrompt(currentProposal) {
  // Usar solo información esencial del catálogo para reducir tokens
  const catalogoResumido = {
    servicios: Object.keys(ORIGEN_SPA_CATALOGO.servicios).join(', '),
    politicas: ORIGEN_SPA_CATALOGO.politicas,
    reglas_clave: "Descuentos máx 15%, precios mínimos según servicio, respetar disponibilidad"
  }
  
  return `Eres asistente de Origen Spa en Trujillo. Ayuda a negociar propuestas de spa.

SERVICIOS: ${catalogoResumido.servicios}
POLÍTICAS: ${JSON.stringify(catalogoResumido.politicas, null, 2)}
REGLAS CLAVE: ${catalogoResumido.reglas_clave}

PROPUESTA ACTUAL: ${JSON.stringify(currentProposal, null, 2)}

REGLAS:
- Ofrecer descuentos hasta 15% máximo
- Respetar precios mínimos del catálogo
- Usar tono amable y profesional en español
- Si el cliente pide algo irrazonable, explica y ofrece alternativas
- Responde en español de forma conversacional

Negocia precio, fecha u horario según las políticas. Si hay cambios, indica claramente el nuevo precio.`
}

/**
 * Extraer cambios en la propuesta desde la respuesta de la IA
 */
function extractProposalChanges(aiMessage, currentProposal) {
  const changes = {}
  
  // Patrones para detectar cambios específicos
  const patterns = {
    precio: /precio[:\s]*S\/\s*(\d+(?:\.\d{2})?)/gi,
    descuento: /descuento[:\s]*(\d+)%/gi,
    duracion: /duración[:\s]*(\d+)\s*(min|horas?)/gi,
    fecha: /fecha[:\s]*([^\n,]+)/gi,
    horario: /horario[:\s]*([^\n,]+)/gi
  }

  // Buscar cambios en el mensaje
  for (const [field, pattern] of Object.entries(patterns)) {
    const matches = aiMessage.match(pattern)
    if (matches) {
      changes[field] = matches[matches.length - 1] // Tomar el último match
    }
  }

  // Si hay cambios, devolverlos
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

  // Mapeo de campos y su procesamiento
  const fieldMappings = {
    precio: (value) => {
      const numValue = parseFloat(value.replace(/[^\d.]/g, ''))
      return isNaN(numValue) ? currentProposal.precio : numValue
    },
    descuento: (value) => {
      const numValue = parseInt(value.replace(/[^\d]/g, ''))
      return isNaN(numValue) ? currentProposal.descuento : Math.min(15, numValue) // Max 15%
    },
    duracion: (value) => {
      const numValue = parseInt(value.replace(/[^\d]/g, ''))
      const unit = value.includes('hora') ? 'horas' : 'min'
      return isNaN(numValue) ? currentProposal.duracion : `${numValue} ${unit}`
    },
    fecha: (value) => value.trim(),
    horario: (value) => value.trim()
  }

  // Aplicar cambios
  for (const [field, changeValue] of Object.entries(changes)) {
    if (fieldMappings[field]) {
      updatedProposal[field] = fieldMappings[field](changeValue)
    }
  }

  return updatedProposal
}

/**
 * Simular respuesta de Mistral (modo sin API key)
 */
function simulateMistralResponse(message, currentProposal) {
  const lowerMessage = message.toLowerCase()
  
  // Respuestas simuladas basadas en patrones comunes
  if (lowerMessage.includes('precio') || lowerMessage.includes('caro')) {
    return {
      success: true,
      message: `Entiendo que el precio de S/ ${currentProposal.precio || '120'} puede ser alto. Podríamos ofrecerte un 10% de descuento si agendas para un día entre semana. El nuevo precio sería S/ ${(currentProposal.precio || 120) * 0.9}. ¿Te funciona?`,
      proposalChanges: { descuento: '10%', precio: (currentProposal.precio || 120) * 0.9 },
      modo: 'simulacion'
    }
  }
  
  if (lowerMessage.includes('fecha') || lowerMessage.includes('horario')) {
    return {
      success: true,
      message: `Claro, podemos ajustar la fecha y horario según tu disponibilidad. ¿Qué día y hora te funcionaría mejor? Tenemos disponibilidad de lunes a viernes de 9am a 7pm, y sábados de 9am a 4pm.`,
      proposalChanges: null,
      modo: 'simulacion'
    }
  }
  
  if (lowerMessage.includes('acepto') || lowerMessage.includes('confirmar')) {
    return {
      success: true,
      message: `¡Excelente! He confirmado tu propuesta. El precio final es S/ ${currentProposal.precio || '120'} con un ${currentProposal.descuento || '0'}% de descuento. Haz clic en el botón "Confirmar Propuesta" para finalizar.`,
      proposalChanges: null,
      confirmar: true,
      modo: 'simulacion'
    }
  }

  return {
    success: true,
    message: `Entiendo. Estoy aquí para ayudarte a personalizar tu propuesta. ¿Qué aspecto te gustaría ajustar? Puedo modificar el precio, fecha, horario, o sugerir servicios adicionales.`,
    proposalChanges: null,
    modo: 'simulacion'
  }
}

/**
 * Respuesta de fallback cuando falla la API
 */
function getFallbackResponse(message, currentProposal) {
  return `Lo siento, estoy teniendo dificultades técnicas en este momento. Sin embargo, puedo ayudarte con ajustes básicos en tu propuesta. El precio actual es S/ ${currentProposal.precio || '120'}. ¿Te gustaría algún cambio específico?`
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
  return token.startsWith('PROP-') && token.length >= 20
}

export default {
  sendMessageToMistral,
  applyProposalChanges,
  generarTokenPropuesta,
  validarTokenPropuesta
}