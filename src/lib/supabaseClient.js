import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidConfigValue(val) {
  if (!val || typeof val !== 'string') return false
  const trimmed = val.trim()
  if (!trimmed) return false
  if (
    trimmed.startsWith('TU-') ||
    trimmed.includes('TU-PROYECTO') ||
    trimmed.includes('TU-ANON-KEY') ||
    trimmed.includes('YOUR_') ||
    trimmed.includes('your-') ||
    trimmed.includes('example.com')
  ) {
    return false
  }
  return true
}

/**
 * Detecta si un error es de red o fetch (sin conexión)
 */
export function isNetworkOrFetchError(error) {
  if (!error) return false
  const msg = (
    String(error?.name || '') + ' ' +
    String(error?.message || '') + ' ' + 
    String(error?.details || '') + ' ' + 
    String(error?.originalError?.message || '') + ' ' +
    String(error?.originalError?.details || '')
  ).toLowerCase()

  return (
    error?.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('load failed') ||
    msg.includes('connection refused')
  )
}

const supabaseConfigured = Boolean(
  isValidConfigValue(supabaseUrl) &&
  isValidConfigValue(supabaseAnonKey) &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost'))
)

if (!supabaseConfigured) {
  logger.warn('supabaseClient', 'Supabase no está configurado con credenciales activas. La aplicación opera en modo demo.')
}

// En modo demo evitamos crear un cliente inválido. Los módulos que necesitan
// persistencia verifican esta condición antes de consultar Supabase.
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
export const isSupabaseConfigured = supabaseConfigured

/**
 * Verifica que Supabase esté configurado antes de operar
 * Lanza un error si no está configurado
 */
export function requireSupabase() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase no está configurado. Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
  }
  return supabase
}

/**
 * Wrapper seguro para operaciones de Supabase
 * Maneja automáticamente el caso cuando Supabase no está configurado o falla la red
 */
export async function safeSupabaseOperation(operation, fallbackValue = null) {
  if (!supabase || !isSupabaseConfigured) {
    return fallbackValue
  }
  
  try {
    return await operation(supabase)
  } catch (error) {
    if (isNetworkOrFetchError(error)) {
      logger.warn('supabaseClient', 'Sin conexión con Supabase (red no disponible). Operando en modo local.', {
        error: error.message || error
      })
    } else {
      logger.warn('supabaseClient', 'Aviso en operación de Supabase, retornando valor por defecto:', {
        error: error.message || error
      })
    }
    return fallbackValue
  }
}

/**
 * Verifica la conexión con Supabase
 */
export async function checkSupabaseConnection() {
  if (!supabase || !isSupabaseConfigured) {
    return { connected: false, error: 'Supabase no configurado' }
  }
  
  try {
    const { data: _data, error } = await supabase.from('estado_contacto').select('count').single()
    
    if (error) {
      if (isNetworkOrFetchError(error)) {
        logger.warn('supabaseClient', 'Supabase no alcanzable (sin conexión), modo demo activo')
        return { connected: false, error: 'Sin conexión a Supabase' }
      }
      logger.warn('supabaseClient', 'Aviso verificando conexión con Supabase', { error })
      return { connected: false, error: error.message }
    }
    
    logger.info('supabaseClient', 'Conexión con Supabase verificada exitosamente')
    return { connected: true }
  } catch (error) {
    if (isNetworkOrFetchError(error)) {
      logger.warn('supabaseClient', 'Sin conexión con Supabase, operando en modo demo')
    } else {
      logger.warn('supabaseClient', 'Error verificando conexión', { error: error.message })
    }
    return { connected: false, error: error.message }
  }
}
