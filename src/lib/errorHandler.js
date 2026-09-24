/**
 * Sistema de manejo de errores estandarizado
 * Proporciona manejo consistente de errores en toda la aplicación
 */

import { logger } from './logger'

/**
 * Clase de error personalizada para errores de la aplicación
 */
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', details = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Error de validación
 */
export class ValidationError extends AppError {
  constructor(message, field = null, details = null) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * Error de Supabase
 */
export class SupabaseError extends AppError {
  constructor(message, originalError = null, details = null) {
    super(message, 'SUPABASE_ERROR', details)
    this.name = 'SupabaseError'
    this.originalError = originalError
  }
}

/**
 * Error de autenticación
 */
export class AuthError extends AppError {
  constructor(message, details = null) {
    super(message, 'AUTH_ERROR', details)
    this.name = 'AuthError'
  }
}

/**
 * Error de red
 */
export class NetworkError extends AppError {
  constructor(message, details = null) {
    super(message, 'NETWORK_ERROR', details)
    this.name = 'NetworkError'
  }
}

/**
 * Manejador centralizado de errores
 */
export function handleError(error, context = {}) {
  // Si es un error de la aplicación, loggear según su tipo
  if (error instanceof AppError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        logger.warn('errorHandler', `Error de validación: ${error.message}`, {
          field: error.field,
          details: error.details,
          context
        })
        break
      case 'AUTH_ERROR':
        logger.error('errorHandler', `Error de autenticación: ${error.message}`, {
          details: error.details,
          context
        })
        break
      case 'SUPABASE_ERROR':
        logger.error('errorHandler', `Error de Supabase: ${error.message}`, {
          originalError: error.originalError,
          details: error.details,
          context
        })
        break
      case 'NETWORK_ERROR':
        logger.warn('errorHandler', `Error de red: ${error.message}`, {
          details: error.details,
          context
        })
        break
      default:
        logger.error('errorHandler', `Error de aplicación: ${error.message}`, {
          code: error.code,
          details: error.details,
          context
        })
    }
    
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        field: error.field || null,
        details: error.details || null
      }
    }
  }
  
  // Si es un error genérico
  if (error instanceof Error) {
    logger.error('errorHandler', `Error genérico: ${error.message}`, {
      stack: error.stack,
      context
    })
    
    return {
      success: false,
      error: {
        message: error.message,
        code: 'GENERIC_ERROR',
        details: null
      }
    }
  }
  
  // Si es un error desconocido
  logger.error('errorHandler', 'Error desconocido', { error, context })
  
  return {
    success: false,
    error: {
      message: 'Error desconocido',
      code: 'UNKNOWN_ERROR',
      details: null
    }
  }
}

/**
 * Wrapper para funciones asíncronas con manejo de errores
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      const result = await fn(...args)
      return { success: true, data: result }
    } catch (error) {
      return handleError(error, context)
    }
  }
}

/**
 * Manejador específico para errores de Supabase
 */
export function handleSupabaseError(error, operation = 'operación') {
  if (!error) {
    return new SupabaseError(`Error desconocido en ${operation}`)
  }
  
  // Mapear códigos de error de Supabase a mensajes amigables
  const errorMessages = {
    'PGRST116': `No se encontraron datos para ${operation}`,
    '23505': 'Ya existe un registro con estos datos',
    '23503': 'Violación de clave foránea',
    '23502': 'Falta un campo requerido',
    '42501': 'No tienes permisos para realizar esta operación',
    '42P01': 'La tabla no existe',
    '42P04': 'El esquema no existe',
    '3D000': 'La base de datos no existe',
    '08006': 'Error de conexión con la base de datos',
    '08P01': 'Error de protocolo de conexión'
  }
  
  const message = errorMessages[error.code] || 
                  error.message || 
                  `Error en ${operation}`
  
  return new SupabaseError(message, error)
}

/**
 * Manejador específico para errores de validación
 */
export function handleValidationError(field, message, value = null) {
  return new ValidationError(message, field, { value })
}

/**
 * Verifica si Supabase está configurado
 */
export function checkSupabaseConfigured() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn('errorHandler', 'Supabase no está configurado')
    throw new NetworkError('Supabase no está configurado. La aplicación está en modo demo.')
  }
  
  return true
}

/**
 * Crea un response estandarizado
 */
export function createResponse(success, data = null, error = null) {
  const response = { success }
  
  if (success) {
    response.data = data
  } else {
    response.error = error
  }
  
  return response
}

export default {
  AppError,
  ValidationError,
  SupabaseError,
  AuthError,
  NetworkError,
  handleError,
  withErrorHandling,
  handleSupabaseError,
  handleValidationError,
  checkSupabaseConfigured,
  createResponse
}