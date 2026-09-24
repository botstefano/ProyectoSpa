/**
 * Sistema de auditoría de cambios
 * Registra quién hizo qué cambio y cuándo
 */

import { supabase, requireSupabase, safeSupabaseOperation } from './supabaseClient'
import { logger } from './logger'

/**
 * Tipos de eventos de auditoría
 */
const AUDIT_EVENT_TYPES = {
  CONTACTO_CREATED: 'contacto_created',
  CONTACTO_UPDATED: 'contacto_updated',
  CONTACTO_TRANSITION: 'contacto_transition',
  LEAD_CALIFICADO: 'lead_calificado',
  PROPUESTA_ACEPTADA: 'propuesta_aceptada',
  PAGO_REGISTRADO: 'pago_registrado',
  PAGO_CONFIRMADO: 'pago_confirmado',
  ATENCION_REGISTRADA: 'atencion_registrada',
  ATENCION_COMPLETADA: 'atencion_completada',
  USUARIO_LOGIN: 'usuario_login',
  USUARIO_LOGOUT: 'usuario_logout',
  ERROR_SISTEMA: 'error_sistema'
}

/**
 * Registra un evento de auditoría
 */
export async function registrarAuditoria(evento) {
  return safeSupabaseOperation(async (client) => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await client.auth.getUser()
      
      const auditoriaData = {
        tipo_evento: evento.tipo,
        id_contacto: evento.idContacto || null,
        id_usuario: user?.id || null,
        email_usuario: user?.email || 'sistema',
        tabla_afectada: evento.tabla || null,
        registro_id: evento.registroId || null,
        datos_anteriores: evento.datosAnteriores || null,
        datos_nuevos: evento.datosNuevos || null,
        ip_address: evento.ipAddress || null,
        user_agent: evento.userAgent || null,
        metadata: evento.metadata || {}
      }
      
      // Intentar insertar en tabla de auditoría si existe
      try {
        const { error } = await client
          .from('auditoria_cambios')
          .insert(auditoriaData)
        
        if (error) {
          // Si la tabla no existe, loggear en localStorage
          logger.warn('auditoria', 'Tabla de auditoría no existe, usando localStorage', { error })
          guardarAuditoriaLocal(auditoriaData)
        } else {
          logger.info('auditoria', 'Evento registrado en base de datos', { tipo: evento.tipo })
        }
      } catch (tableError) {
        // Si la tabla no existe, usar localStorage
        logger.warn('auditoria', 'Error accediendo a tabla de auditoría, usando localStorage', { error: tableError })
        guardarAuditoriaLocal(auditoriaData)
      }
      
      return { success: true }
    } catch (error) {
      logger.error('auditoria', 'Error registrando auditoría', { error, evento })
      return { success: false, error: error.message }
    }
  }, null)
}

/**
 * Guarda auditoría en localStorage como fallback
 */
function guardarAuditoriaLocal(data) {
  try {
    const auditorias = JSON.parse(localStorage.getItem('origen_spa_auditoria') || '[]')
    auditorias.push({
      ...data,
      fecha_local: new Date().toISOString()
    })
    
    // Mantener solo los últimos 500 registros
    if (auditorias.length > 500) {
      auditorias.shift()
    }
    
    localStorage.setItem('origen_spa_auditoria', JSON.stringify(auditorias))
  } catch (error) {
    logger.error('auditoria', 'Error guardando auditoría local', { error })
  }
}

/**
 * Obtiene historial de auditoría de un contacto
 */
export async function obtenerAuditoriaContacto(idContacto) {
  return safeSupabaseOperation(async (client) => {
    try {
      const { data, error } = await client
        .from('auditoria_cambios')
        .select('*')
        .eq('id_contacto', idContacto)
        .order('fecha_creacion', { ascending: false })
        .limit(50)
      
      if (error) {
        logger.warn('auditoria', 'Error obteniendo auditoría de contacto', { error })
        return obtenerAuditoriaLocalContacto(idContacto)
      }
      
      return data || []
    } catch (error) {
      logger.error('auditoria', 'Error obteniendo auditoría', { error })
      return obtenerAuditoriaLocalContacto(idContacto)
    }
  }, [])
}

/**
 * Obtiene auditoría local de un contacto
 */
function obtenerAuditoriaLocalContacto(idContacto) {
  try {
    const auditorias = JSON.parse(localStorage.getItem('origen_spa_auditoria') || '[]')
    return auditorias.filter(a => a.id_contacto === idContacto)
  } catch (error) {
    logger.error('auditoria', 'Error obteniendo auditoría local', { error })
    return []
  }
}

/**
 * Obtiene toda la auditoría local
 */
export function obtenerAuditoriaLocal() {
  try {
    return JSON.parse(localStorage.getItem('origen_spa_auditoria') || '[]')
  } catch (error) {
    logger.error('auditoria', 'Error obteniendo auditoría local', { error })
    return []
  }
}

/**
 * Limpia la auditoría local
 */
export function limpiarAuditoriaLocal() {
  try {
    localStorage.removeItem('origen_spa_auditoria')
    logger.info('auditoria', 'Auditoría local limpiada')
  } catch (error) {
    logger.error('auditoria', 'Error limpiando auditoría local', { error })
  }
}

/**
 * Wrapper para registrar auditoría automáticamente en operaciones
 */
export function conAuditoria(tipoEvento, tabla, funcionOriginal) {
  return async (...args) => {
    const resultado = await funcionOriginal(...args)
    
    // Intentar registrar auditoría
    try {
      const metadata = {
        args: args.map(arg => {
          // Sanitizar datos sensibles
          if (typeof arg === 'object' && arg !== null) {
            const sanitizado = { ...arg }
            // Eliminar campos sensibles
            delete sanitizado.password
            delete sanitizado.token
            delete sanitizado.apiKey
            return sanitizado
          }
          return arg
        })
      }
      
      await registrarAuditoria({
        tipo: tipoEvento,
        tabla: tabla,
        metadata: metadata
      })
    } catch (error) {
      // No bloquear la operación principal si falla la auditoría
      logger.warn('auditoria', 'Error registrando auditoría automática', { error })
    }
    
    return resultado
  }
}

/**
 * Registra transición de fase de un contacto
 */
export async function registrarTransicionFase(idContacto, faseOrigen, faseDestino, datosAdicionales = {}) {
  return registrarAuditoria({
    tipo: AUDIT_EVENT_TYPES.CONTACTO_TRANSITION,
    idContacto: idContacto,
    tabla: 'contacto',
    datosAnteriores: { fase: faseOrigen },
    datosNuevos: { fase: faseDestino },
    metadata: datosAdicionales
  })
}

/**
 * Registra error del sistema
 */
export async function registrarErrorSistema(error, contexto = {}) {
  return registrarAuditoria({
    tipo: AUDIT_EVENT_TYPES.ERROR_SISTEMA,
    tabla: 'sistema',
    datosNuevos: {
      error: error.message,
      stack: error.stack,
      contexto
    },
    metadata: {
      timestamp: new Date().toISOString(),
      severidad: 'error'
    }
  })
}

/**
 * Crea tabla de auditoría si no existe (para desarrollo)
 */
export async function crearTablaAuditoriaSiNoExiste() {
  return safeSupabaseOperation(async (client) => {
    try {
      const { error } = await client.rpc('crear_tabla_auditoria_si_no_existe')
      
      if (error) {
        logger.warn('auditoria', 'No se pudo crear tabla de auditoría (puede que ya exista)', { error })
      }
    } catch (error) {
      logger.warn('auditoria', 'Error creando tabla de auditoría', { error })
    }
  }, null)
}

export default {
  registrarAuditoria,
  obtenerAuditoriaContacto,
  obtenerAuditoriaLocal,
  limpiarAuditoriaLocal,
  conAuditoria,
  registrarTransicionFase,
  registrarErrorSistema,
  crearTablaAuditoriaSiNoExiste,
  AUDIT_EVENT_TYPES
}