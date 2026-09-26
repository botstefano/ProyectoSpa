import { createContext, useContext, useState, useEffect } from 'react'

const StaffAuthContext = createContext(null)

const STORAGE_KEY = 'origen_spa_staff_session'

// Credenciales predeterminadas para el equipo de Origen Spa
const STAFF_CREDENTIALS = [
  { username: 'admin', password: 'spa2026', name: 'Administrador IMPULSE', role: 'Director de Spa' },
  { username: 'recepcion', password: 'origen123', name: 'Recepción y Caja', role: 'Staff de Atención' },
  { username: 'stefano', password: 'admin123', name: 'Stefano', role: 'Administrador de Sistema' },
  { username: 'especialista', password: 'spa2026', name: 'María López', role: 'Especialista Cosmética' },
]

export function StaffAuthProvider({ children }) {
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [redirectAfterLogin, setRedirectAfterLogin] = useState('/staff/leads')

  useEffect(() => {
    if (staffUser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(staffUser))
      } catch (err) {
        console.error('Error guardando sesión:', err)
      }
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [staffUser])

  function login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase()
    const cleanPass = (password || '').trim()

    const match = STAFF_CREDENTIALS.find(
      (c) => c.username.toLowerCase() === cleanUser && c.password === cleanPass
    )

    if (match) {
      const session = {
        username: match.username,
        name: match.name,
        role: match.role,
        loginAt: new Date().toISOString(),
      }
      setStaffUser(session)
      setLoginModalOpen(false)
      return { success: true, user: session }
    }

    // Permitir cualquier usuario con contraseña maestra "spa2026"
    if (cleanPass === 'spa2026' && cleanUser.length >= 3) {
      const session = {
        username: cleanUser,
        name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
        role: 'Staff Origen Spa',
        loginAt: new Date().toISOString(),
      }
      setStaffUser(session)
      setLoginModalOpen(false)
      return { success: true, user: session }
    }

    return {
      success: false,
      error: 'Credenciales inválidas. Usuario o contraseña incorrectos.',
    }
  }

  function logout() {
    setStaffUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  function openLoginModal(targetPath = '/staff/leads') {
    setRedirectAfterLogin(targetPath)
    setLoginModalOpen(true)
  }

  function closeLoginModal() {
    setLoginModalOpen(false)
  }

  return (
    <StaffAuthContext.Provider
      value={{
        staffUser,
        isAuthenticated: !!staffUser,
        login,
        logout,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
        redirectAfterLogin,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext)
  if (!context) {
    throw new Error('useStaffAuth debe usarse dentro de un StaffAuthProvider')
  }
  return context
}
