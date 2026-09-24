/**
 * Sistema de autenticación para paneles staff
 * Proporciona funciones para login, logout y verificación de autenticación
 */

import { supabase } from './supabaseClient'
import { logger } from './logger'
import { AuthError } from './errorHandler'

/**
 * Verifica si hay un usuario autenticado
 */
export async function isAuthenticated() {
  try {
    if (!supabase) return false
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      logger.warn('auth', 'Error verificando autenticación', { error })
      return false
    }
    
    return !!user
  } catch (error) {
    logger.error('auth', 'Error en verificación de autenticación', { error })
    return false
  }
}

/**
 * Obtiene el usuario autenticado actual
 */
export async function getCurrentUser() {
  try {
    if (!supabase) return null
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      logger.warn('auth', 'Error obteniendo usuario actual', { error })
      return null
    }
    
    return user
  } catch (error) {
    logger.error('auth', 'Error obteniendo usuario actual', { error })
    return null
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export async function signIn(email, password) {
  try {
    if (!supabase) {
      throw new AuthError('Supabase no está configurado')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      logger.warn('auth', 'Error en inicio de sesión', { error, email })
      throw new AuthError(error.message || 'Error al iniciar sesión')
    }
    
    logger.info('auth', 'Usuario inició sesión exitosamente', { email })
    return { success: true, user: data.user }
  } catch (error) {
    logger.error('auth', 'Error en signIn', { error, email })
    throw error
  }
}

/**
 * Cierra la sesión del usuario
 */
export async function signOut() {
  try {
    if (!supabase) {
      logger.warn('auth', 'Intento de logout sin Supabase configurado')
      return { success: true }
    }
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logger.warn('auth', 'Error en cierre de sesión', { error })
      throw new AuthError(error.message || 'Error al cerrar sesión')
    }
    
    logger.info('auth', 'Usuario cerró sesión exitosamente')
    return { success: true }
  } catch (error) {
    logger.error('auth', 'Error en signOut', { error })
    throw error
  }
}

/**
 * Componente de protección de rutas
 * Redirige a login si no está autenticado
 */
export function requireAuth(Component) {
  return function AuthenticatedComponent(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
      async function checkAuth() {
        const authenticated = await isAuthenticated()
        setIsAuthenticated(authenticated)
        setLoading(false)
        
        if (!authenticated) {
          // Redirigir a login o mostrar componente de login
          window.location.href = '/staff/login'
        }
      }
      
      checkAuth()
    }, [])
    
    if (loading) {
      return <div>Verificando autenticación...</div>
    }
    
    if (!isAuthenticated) {
      return <div>Redirigiendo a login...</div>
    }
    
    return <Component {...props} />
  }
}

/**
 * Hook personalizado para autenticación
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    
    loadUser()
  }, [])
  
  const login = async (email, password) => {
    const result = await signIn(email, password)
    if (result.success) {
      setUser(result.user)
    }
    return result
  }
  
  const logout = async () => {
    await signOut()
    setUser(null)
  }
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 * Esto requiere que los roles estén almacenados en user_metadata
 */
export function hasRole(user, role) {
  if (!user || !user.user_metadata) return false
  return user.user_metadata.role === role
}

/**
 * Verifica si el usuario es administrador
 */
export function isAdmin(user) {
  return hasRole(user, 'admin')
}

/**
 * Verifica si el usuario es staff
 */
export function isStaff(user) {
  return hasRole(user, 'staff') || isAdmin(user)
}

// Importar useState y useEffect si estamos en React
import { useState, useEffect } from 'react'

export default {
  isAuthenticated,
  getCurrentUser,
  signIn,
  signOut,
  requireAuth,
  useAuth,
  hasRole,
  isAdmin,
  isStaff
}