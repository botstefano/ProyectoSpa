/**
 * Sistema de validación de datos robusto
 * Proporciona validación para emails, teléfonos, formatos, etc.
 */

import { logger } from './logger'

/**
 * Valida formato de email
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email es requerido' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' }
  }
  
  // Validaciones adicionales
  if (email.length > 100) {
    return { valid: false, error: 'Email demasiado largo (máximo 100 caracteres)' }
  }
  
  return { valid: true }
}

/**
 * Valida formato de teléfono peruano
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Teléfono es requerido' }
  }
  
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Validar formato peruano: +51 9XX XXX XXX o 9XX XXX XXX
  const phoneRegex = /^(\+51)?9\d{8}$/
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Formato de teléfono inválido. Use formato: +51 9XX XXX XXX o 9XX XXX XXX' }
  }
  
  return { valid: true, cleanPhone }
}

/**
 * Valida nombre completo
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nombre es requerido' }
  }
  
  const trimmedName = name.trim()
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Nombre debe tener al menos 2 caracteres' }
  }
  
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Nombre demasiado largo (máximo 100 caracteres)' }
  }
  
  // Validar que no contenga números
  if (/\d/.test(trimmedName)) {
    return { valid: false, error: 'Nombre no debe contener números' }
  }
  
  return { valid: true, cleanName: trimmedName }
}

/**
 * Valida monto monetario
 */
export function validateAmount(amount, min = 0, max = 100000) {
  const numAmount = parseFloat(amount)
  
  if (isNaN(numAmount)) {
    return { valid: false, error: 'Monto debe ser un número válido' }
  }
  
  if (numAmount < min) {
    return { valid: false, error: `Monto debe ser al menos ${min}` }
  }
  
  if (numAmount > max) {
    return { valid: false, error: `Monto no puede exceder ${max}` }
  }
  
  return { valid: true, cleanAmount: numAmount }
}

/**
 * Valida lead score (0-100)
 */
export function validateLeadScore(score) {
  const numScore = parseInt(score, 10)
  
  if (isNaN(numScore)) {
    return { valid: false, error: 'Lead score debe ser un número' }
  }
  
  if (numScore < 0 || numScore > 100) {
    return { valid: false, error: 'Lead score debe estar entre 0 y 100' }
  }
  
  return { valid: true, cleanScore: numScore }
}

/**
 * Valida fecha
 */
export function validateDate(dateString, allowFuture = true, allowPast = true) {
  if (!dateString) {
    return { valid: false, error: 'Fecha es requerida' }
  }
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Fecha inválida' }
  }
  
  const now = new Date()
  
  if (!allowFuture && date > now) {
    return { valid: false, error: 'Fecha no puede ser futura' }
  }
  
  if (!allowPast && date < now) {
    return { valid: false, error: 'Fecha no puede ser pasada' }
  }
  
  return { valid: true, cleanDate: date }
}

/**
 * Valida satisfacción (1-5)
 */
export function validateSatisfaction(satisfaction) {
  const numSat = parseInt(satisfaction, 10)
  
  if (isNaN(numSat)) {
    return { valid: false, error: 'Satisfacción debe ser un número' }
  }
  
  if (numSat < 1 || numSat > 5) {
    return { valid: false, error: 'Satisfacción debe estar entre 1 y 5' }
  }
  
  return { valid: true, cleanSatisfaction: numSat }
}

/**
 * Valida longitud de texto
 */
export function validateTextLength(text, fieldName, minLength = 0, maxLength = 1000) {
  if (!text && minLength > 0) {
    return { valid: false, error: `${fieldName} es requerido` }
  }
  
  if (text && text.length < minLength) {
    return { valid: false, error: `${fieldName} debe tener al menos ${minLength} caracteres` }
  }
  
  if (text && text.length > maxLength) {
    return { valid: false, error: `${fieldName} no puede exceder ${maxLength} caracteres` }
  }
  
  return { valid: true }
}

/**
 * Validador de formulario completo
 */
export function validateForm(formData, schema) {
  const errors = {}
  let isValid = true
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field]
    
    for (const rule of rules) {
      const result = rule(value)
      if (!result.valid) {
        errors[field] = result.error
        isValid = false
        break // Solo mostrar el primer error por campo
      }
    }
  }
  
  return { isValid, errors }
}

/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validador de contacto completo
 */
export function validateContact(contact) {
  const schema = {
    nombre: [
      (value) => validateName(value)
    ],
    email: [
      (value) => validateEmail(value)
    ],
    telefono: [
      (value) => validatePhone(value)
    ]
  }
  
  const result = validateForm(contact, schema)
  
  if (!result.isValid) {
    logger.warn('validators', 'Validación de contacto fallida', { errors: result.errors })
  }
  
  return result
}

export default {
  validateEmail,
  validatePhone,
  validateName,
  validateAmount,
  validateLeadScore,
  validateDate,
  validateSatisfaction,
  validateTextLength,
  validateForm,
  sanitizeInput,
  validateContact
}