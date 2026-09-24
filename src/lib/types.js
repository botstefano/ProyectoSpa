/**
 * Sistema de validación de tipos y contratos
 * Proporciona validación de estructura de datos sin TypeScript
 */

import { logger } from './logger'

/**
 * Validador de tipos básicos
 */
export const TypeValidators = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && !isNaN(value),
  boolean: (value) => typeof value === 'boolean',
  array: (value) => Array.isArray(value),
  object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
  date: (value) => value instanceof Date || !isNaN(Date.parse(value)),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^(\+51)?9\d{8}$/.test(value.replace(/[\s\-\(\)]/g, '')),
  url: (value) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Esquemas de validación para entidades del sistema
 */
export const Schemas = {
  contacto: {
    id_contacto: TypeValidators.number,
    nombre: TypeValidators.string,
    telefono: TypeValidators.string,
    email: TypeValidators.email,
    fecha_registro: TypeValidators.date,
    id_fuente: TypeValidators.number,
    id_estado: TypeValidators.number
  },
  
  lead_detalle: {
    id_contacto: TypeValidators.number,
    lead_score: (value) => TypeValidators.number(value) && value >= 0 && value <= 100,
    fecha_calificacion: TypeValidators.date,
    propuesta_aceptada: TypeValidators.boolean,
    fecha_aceptacion: TypeValidators.date,
    datos_propuesta: TypeValidators.object
  },
  
  pago_detalle: {
    id_contacto: TypeValidators.number,
    estado_pago: TypeValidators.string,
    fecha_pago: TypeValidators.date,
    servicio_contratado: TypeValidators.string,
    monto_total: (value) => TypeValidators.number(value) && value >= 0,
    metodo_pago: TypeValidators.string
  },
  
  atencion_detalle: {
    id_atencion: TypeValidators.number,
    id_contacto: TypeValidators.number,
    tipo_tratamiento: TypeValidators.string,
    especialista: TypeValidators.string,
    fecha_hora_inicio: TypeValidators.date,
    fecha_hora_fin: TypeValidators.date,
    duracion_planificada_min: (value) => TypeValidators.number(value) && value >= 10 && value <= 240,
    estado_atencion: (value) => ['programada', 'en_atencion', 'completada', 'no_asistio'].includes(value),
    satisfaccion: (value) => value === null || (TypeValidators.number(value) && value >= 1 && value <= 5)
  },
  
  notificacion_fase: {
    id_notificacion: TypeValidators.number,
    id_contacto: TypeValidators.number,
    fase_origen: (value) => ['buyers', 'leads', 'payers', 'customers'].includes(value),
    fase_destino: (value) => ['buyers', 'leads', 'payers', 'customers'].includes(value),
    tipo_evento: TypeValidators.string,
    mensaje: TypeValidators.string,
    leida: TypeValidators.boolean
  }
}

/**
 * Valida un objeto contra un esquema
 */
export function validateSchema(data, schema, entityName = 'Entidad') {
  const errors = []
  const warnings = []
  
  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field]
    
    // Si el valor es undefined/null y no es requerido, saltar
    if (value === undefined || value === null) {
      warnings.push(`${entityName}.${field} está ausente`)
      continue
    }
    
    if (!validator(value)) {
      errors.push(`${entityName}.${field} tiene tipo inválido: ${typeof value}`)
    }
  }
  
  // Verificar campos extra no definidos en el esquema
  for (const field of Object.keys(data)) {
    if (!schema[field]) {
      warnings.push(`${entityName}.${field} no está definido en el esquema`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valida un contacto
 */
export function validateContacto(data) {
  return validateSchema(data, Schemas.contacto, 'contacto')
}

/**
 * Valida un lead_detalle
 */
export function validateLeadDetalle(data) {
  return validateSchema(data, Schemas.lead_detalle, 'lead_detalle')
}

/**
 * Valida un pago_detalle
 */
export function validatePagoDetalle(data) {
  return validateSchema(data, Schemas.pago_detalle, 'pago_detalle')
}

/**
 * Valida una atencion_detalle
 */
export function validateAtencionDetalle(data) {
  return validateSchema(data, Schemas.atencion_detalle, 'atencion_detalle')
}

/**
 * Valida una notificacion_fase
 */
export function validateNotificacion(data) {
  return validateSchema(data, Schemas.notificacion_fase, 'notificacion_fase')
}

/**
 * Sanitiza un objeto removiendo campos undefined/null
 */
export function sanitizeObject(data, schema = null) {
  const result = {}
  
  for (const [key, value] of Object.entries(data)) {
    // Si hay esquema, solo incluir campos definidos
    if (schema && !schema[key]) continue
    
    // No incluir undefined/null
    if (value !== undefined && value !== null) {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Convierte string a número de forma segura
 */
export function safeToNumber(value, defaultValue = 0) {
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * Convierte string a boolean de forma segura
 */
export function safeToBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return defaultValue
}

/**
 * Convierte string a fecha de forma segura
 */
export function safeToDate(value, defaultValue = null) {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? defaultValue : date
  }
  return defaultValue
}

/**
 * Valida y sanitiza datos de entrada
 */
export function validateAndSanitize(data, schema, entityName) {
  const validation = validateSchema(data, schema, entityName)
  
  if (!validation.valid) {
    logger.warn('types', `Validación fallida para ${entityName}`, { 
      errors: validation.errors,
      warnings: validation.warnings 
    })
  }
  
  const sanitized = sanitizeObject(data, schema)
  
  return {
    valid: validation.valid,
    sanitized,
    errors: validation.errors,
    warnings: validation.warnings
  }
}

/**
 * Type guard para verificar si un valor es de un tipo específico
 */
export function isType(value, type) {
  const validators = {
    string: TypeValidators.string,
    number: TypeValidators.number,
    boolean: TypeValidators.boolean,
    array: TypeValidators.array,
    object: TypeValidators.object,
    date: TypeValidators.date
  }
  
  const validator = validators[type]
  return validator ? validator(value) : false
}

/**
 * Verifica si un objeto tiene todas las propiedades requeridas
 */
export function hasRequiredProperties(data, requiredProps) {
  return requiredProps.every(prop => prop in data && data[prop] !== undefined && data[prop] !== null)
}

export default {
  TypeValidators,
  Schemas,
  validateSchema,
  validateContacto,
  validateLeadDetalle,
  validatePagoDetalle,
  validateAtencionDetalle,
  validateNotificacion,
  sanitizeObject,
  safeToNumber,
  safeToBoolean,
  safeToDate,
  validateAndSanitize,
  isType,
  hasRequiredProperties
}