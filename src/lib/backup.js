/**
 * Sistema de backup y restore básico
 * Permite exportar/importar datos críticos del sistema
 */

import { supabase, requireSupabase, safeSupabaseOperation } from './supabaseClient'
import { logger } from './logger'

const BACKUP_KEY = 'origen_spa_backup'
const BACKUP_VERSION = '1.0'

/**
 * Estructura de backup
 */
interface BackupStructure {
  version: string
  fecha: string
  datos: {
    contactos?: any[]
    leads_detalle?: any[]
    pagos_detalle?: any[]
    atenciones_detalle?: any[]
    notificaciones?: any[]
  }
  metadata: {
    total_registros: number
    tablas_incluidas: string[]
  }
}

/**
 * Crea un backup de los datos críticos
 */
export async function crearBackup(tablas = ['contacto', 'lead_detalle', 'pago_detalle', 'atencion_detalle']) {
  try {
    logger.info('backup', 'Iniciando proceso de backup', { tablas })
    
    const backupData = {
      version: BACKUP_VERSION,
      fecha: new Date().toISOString(),
      datos: {},
      metadata: {
        total_registros: 0,
        tablas_incluidas: tablas
      }
    }
    
    for (const tabla of tablas) {
      try {
        const result = await safeSupabaseOperation(async (client) => {
          const { data, error } = await client
            .from(tabla)
            .select('*')
            .limit(1000) // Limitar a 1000 registros por tabla
          
          if (error) throw error
          return data
        }, [])
        
        if (result && result.length > 0) {
          backupData.datos[tabla] = result
          backupData.metadata.total_registros += result.length
          logger.info('backup', `Backup completado para tabla ${tabla}`, { registros: result.length })
        }
      } catch (error) {
        logger.warn('backup', `Error haciendo backup de tabla ${tabla}`, { error })
        // Continuar con otras tablas
      }
    }
    
    // Guardar en localStorage
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData))
    
    logger.info('backup', 'Backup completado exitosamente', backupData.metadata)
    
    return {
      success: true,
      metadata: backupData.metadata,
      fecha: backupData.fecha
    }
  } catch (error) {
    logger.error('backup', 'Error creando backup', { error })
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Restaura datos desde un backup
 */
export async function restaurarBackup(backupData = null) {
  try {
    const backup = backupData || JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null')
    
    if (!backup) {
      throw new Error('No hay backup disponible para restaurar')
    }
    
    if (backup.version !== BACKUP_VERSION) {
      logger.warn('backup', 'Versión de backup incompatible', { 
        backupVersion: backup.version, 
        currentVersion: BACKUP_VERSION 
      })
    }
    
    logger.info('backup', 'Iniciando restauración', { 
      fecha: backup.fecha,
      tablas: backup.metadata.tablas_incluidas 
    })
    
    const client = requireSupabase()
    const resultados = {}
    
    for (const tabla of Object.keys(backup.datos)) {
      try {
        const datos = backup.datos[tabla]
        
        if (!datos || datos.length === 0) continue
        
        // Eliminar datos existentes (con cuidado)
        const { error: deleteError } = await client
          .from(tabla)
          .delete()
          .neq('id_contacto', 0) // Truco para eliminar todos (puede variar según la tabla)
        
        if (deleteError) {
          logger.warn('backup', `Error limpiando tabla ${tabla}`, { error })
        }
        
        // Insertar datos del backup
        const { error: insertError } = await client
          .from(tabla)
          .insert(datos)
        
        if (insertError) {
          throw insertError
        }
        
        resultados[tabla] = {
          success: true,
          registros: datos.length
        }
        
        logger.info('backup', `Tabla ${tabla} restaurada`, { registros: datos.length })
      } catch (error) {
        logger.error('backup', `Error restaurando tabla ${tabla}`, { error })
        resultados[tabla] = {
          success: false,
          error: error.message
        }
      }
    }
    
    const exito = Object.values(resultados).every(r => r.success)
    
    logger.info('backup', 'Restauración completada', { exito, resultados })
    
    return {
      success: exito,
      resultados,
      fecha_backup: backup.fecha
    }
  } catch (error) {
    logger.error('backup', 'Error restaurando backup', { error })
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Obtiene el backup actual del localStorage
 */
export function obtenerBackupLocal() {
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null')
    return backup
  } catch (error) {
    logger.error('backup', 'Error obteniendo backup local', { error })
    return null
  }
}

/**
 * Elimina el backup local
 */
export function eliminarBackupLocal() {
  try {
    localStorage.removeItem(BACKUP_KEY)
    logger.info('backup', 'Backup local eliminado')
    return { success: true }
  } catch (error) {
    logger.error('backup', 'Error eliminando backup local', { error })
    return { success: false, error: error.message }
  }
}

/**
 * Exporta backup a un archivo JSON
 */
export function exportarBackupArchivo() {
  try {
    const backup = obtenerBackupLocal()
    
    if (!backup) {
      throw new Error('No hay backup disponible para exportar')
    }
    
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `origen_spa_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    logger.info('backup', 'Backup exportado a archivo')
    return { success: true }
  } catch (error) {
    logger.error('backup', 'Error exportando backup', { error })
    return { success: false, error: error.message }
  }
}

/**
 * Importa backup desde un archivo JSON
 */
export function importarBackupArchivo(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result)
        
        // Validar estructura básica
        if (!backupData.version || !backupData.datos) {
          throw new Error('Formato de backup inválido')
        }
        
        const resultado = await restaurarBackup(backupData)
        resolve(resultado)
      } catch (error) {
        logger.error('backup', 'Error importando backup', { error })
        reject(error)
      }
    }
    
    reader.onerror = () => {
      const error = new Error('Error leyendo archivo')
      logger.error('backup', 'Error leyendo archivo de backup', { error })
      reject(error)
    }
    
    reader.readAsText(archivo)
  })
}

/**
 * Obtiene información sobre el backup actual
 */
export function obtenerInfoBackup() {
  const backup = obtenerBackupLocal()
  
  if (!backup) {
    return {
      existe: false,
      mensaje: 'No hay backup disponible'
    }
  }
  
  return {
    existe: true,
    version: backup.version,
    fecha: backup.fecha,
    metadata: backup.metadata,
    antiguedad: Math.floor((new Date() - new Date(backup.fecha)) / (1000 * 60 * 60 * 24)) // días
  }
}

/**
 * Programa backups automáticos
 */
export function programarBackupAutomatico(intervaloHoras = 24) {
  const intervaloMs = intervaloHoras * 60 * 60 * 1000
  
  logger.info('backup', `Backup automático programado cada ${intervaloHoras} horas`)
  
  setInterval(async () => {
    try {
      await crearBackup()
      logger.info('backup', 'Backup automático ejecutado')
    } catch (error) {
      logger.error('backup', 'Error en backup automático', { error })
    }
  }, intervaloMs)
}

export default {
  crearBackup,
  restaurarBackup,
  obtenerBackupLocal,
  eliminarBackupLocal,
  exportarBackupArchivo,
  importarBackupArchivo,
  obtenerInfoBackup,
  programarBackupAutomatico
}