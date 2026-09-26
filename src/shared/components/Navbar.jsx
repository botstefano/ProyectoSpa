import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { obtenerNotificacionesPendientes } from '../../lib/notificaciones'
import { useStaffAuth } from '../../features/auth/StaffAuthContext'

export default function Navbar({ onCtaClick }) {
  const { isAuthenticated, staffUser, openLoginModal, logout } = useStaffAuth()
  const [staffMenuOpen, setStaffMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notificaciones = await obtenerNotificacionesPendientes('leads')
        setNotificationCount(notificaciones.length)
      } catch (error) {
        console.error('[Navbar] Error cargando notificaciones:', error)
      }
    }

    if (isAuthenticated) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  function handleStaffClick() {
    if (!isAuthenticated) {
      openLoginModal('/staff/leads')
    } else {
      setStaffMenuOpen(!staffMenuOpen)
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="navbar-mark">Origen Spa &amp; Bienestar</span>
        </Link>
        <div className="navbar-actions">
          <div className="navbar-staff-dropdown" style={{ position: 'relative' }}>
            <button
              className="navbar-staff-link dropdown-toggle"
              onClick={handleStaffClick}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <span>{isAuthenticated ? '🟢' : '🔐'}</span>
              <span>{isAuthenticated ? `Staff: ${staffUser?.name?.split(' ')[0] || 'Admin'}` : 'Acceso Staff'}</span>
              {isAuthenticated && notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
              {isAuthenticated && (
                <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>

            {isAuthenticated && staffMenuOpen && (
              <div className="dropdown-menu" style={{ minWidth: '220px' }}>
                <div style={{ padding: '0.5rem 0.8rem', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.8rem', color: '#666' }}>
                  Sesión activa: <strong>{staffUser?.name}</strong>
                </div>
                <Link to="/staff/leads" onClick={() => setStaffMenuOpen(false)}>
                  <span className="dropdown-icon">👥</span>
                  Fase 2: Leads (Negociación)
                </Link>
                <Link to="/staff/payers" onClick={() => setStaffMenuOpen(false)}>
                  <span className="dropdown-icon">💳</span>
                  Fase 3: Payers (Pagos)
                </Link>
                <Link to="/staff/customers" onClick={() => setStaffMenuOpen(false)}>
                  <span className="dropdown-icon">🌟</span>
                  Fase 4: Customers (Atención)
                </Link>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setStaffMenuOpen(false)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '0.6rem 0.8rem',
                      color: '#d90429',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🚪</span>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="navbar-cta" onClick={onCtaClick}>
            Reservar diagnóstico
          </button>
        </div>
      </div>
    </nav>
  )
}
