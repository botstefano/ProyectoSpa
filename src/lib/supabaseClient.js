import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigured) {
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
