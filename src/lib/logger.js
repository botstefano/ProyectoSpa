/**
 * Sistema de logging centralizado para Origen Spa
 * Proporciona logging estructurado con niveles y contexto
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
}

// En producción, solo mostrar WARN y ERROR
const PRODUCTION_LOG_LEVEL = 'WARN'
const currentLevel = import.meta.env.MODE === 'production' ? PRODUCTION_LOG_LEVEL : 'DEBUG'

const levelPriority = {
  [LOG_LEVELS.ERROR]: 0,
  [LOG_LEVELS.WARN]: 1,
  [LOG_LEVELS.INFO]: 2,
  [LOG_LEVELS.DEBUG]: 3
}

function shouldLog(level) {
  return levelPriority[level] <= levelPriority[currentLevel]
}

function formatTimestamp() {
  return new Date().toISOString()
}

function formatLogEntry(level, module, message, data = null) {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    module,
    message
  }
  
  if (data) {
    entry.data = data
  }
  
  return entry
}

function log(level, module, message, data = null) {
  if (!shouldLog(level)) return
  
  const entry = formatLogEntry(level, module, message, data)
  
  // En desarrollo, usar console con colores
  if (import.meta.env.MODE !== 'production') {
    const consoleMethod = level === LOG_LEVELS.ERROR ? 'error' : 
                          level === LOG_LEVELS.WARN ? 'warn' : 
                          level === LOG_LEVELS.DEBUG ? 'debug' : 'log'
    
    const prefix = `[${entry.timestamp}] [${level}] [${module}]`
    console[consoleMethod](prefix, message, data || '')
  } else {
    // En producción, enviar a servicio de logging (puede implementarse después)
    console.log(JSON.stringify(entry))
  }
  
  // Guardar en localStorage para debugging local
  try {
    const logs = JSON.parse(localStorage.getItem('origen_spa_logs') || '[]')
    logs.push(entry)
    // Mantener solo los últimos 100 logs
    if (logs.length > 100) {
      logs.shift()
    }
    localStorage.setItem('origen_spa_logs', JSON.stringify(logs))
  } catch (e) {
    // Silenciar errores de localStorage
  }
}

/**
 * API de logging por módulos
 */
export const logger = {
  error: (module, message, data) => log(LOG_LEVELS.ERROR, module, message, data),
  warn: (module, message, data) => log(LOG_LEVELS.WARN, module, message, data),
  info: (module, message, data) => log(LOG_LEVELS.INFO, module, message, data),
  debug: (module, message, data) => log(LOG_LEVELS.DEBUG, module, message, data),
  
  // Método para obtener logs almacenados
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('origen_spa_logs') || '[]')
    } catch (e) {
      return []
    }
  },
  
  // Método para limpiar logs
  clearLogs: () => {
    try {
      localStorage.removeItem('origen_spa_logs')
    } catch (e) {
      // Silenciar errores
    }
  }
}

export default logger