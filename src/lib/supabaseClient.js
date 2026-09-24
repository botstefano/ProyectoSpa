import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'
import { checkSupabaseConfigured } from './errorHandler'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigured) {
  logger.warn('supabaseClient', 'Supabase no está configurado. La aplicación funcionará en modo demo.')
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Sin credenciales: la aplicación puede ejecutarse en modo demo. ' +
    'Configura VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY para habilitar persistencia.'
  )
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
    logger.error('supabaseClient', 'Intento de usar Supabase sin configuración')
    throw new Error('Supabase no está configurado. Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
  }
  return supabase
}

/**
 * Wrapper seguro para operaciones de Supabase
 * Maneja automáticamente el caso cuando Supabase no está configurado
 */
export function safeSupabaseOperation(operation, fallbackValue = null) {
  if (!supabase || !isSupabaseConfigured) {
    logger.warn('supabaseClient', 'Operación de Supabase cancelada: no configurado')
    return Promise.resolve(fallbackValue)
  }
  
  return operation(supabase)
}

/**
 * Verifica la conexión con Supabase
 */
export async function checkSupabaseConnection() {
  if (!supabase || !isSupabaseConfigured) {
    return { connected: false, error: 'Supabase no configurado' }
  }
  
  try {
    const { data, error } = await supabase.from('estado_contacto').select('count').single()
    
    if (error) {
      logger.error('supabaseClient', 'Error verificando conexión con Supabase', { error })
      return { connected: false, error: error.message }
    }
    
    logger.info('supabaseClient', 'Conexión con Supabase verificada exitosamente')
    return { connected: true }
  } catch (error) {
    logger.error('supabaseClient', 'Error inesperado verificando conexión', { error })
    return { connected: false, error: error.message }
  }
}
