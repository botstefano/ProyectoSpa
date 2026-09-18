import { useState, useEffect } from 'react'
import { obtenerNotificacionesPendientes } from '../../lib/notificaciones'

export default function Navbar({ onCtaClick }) {
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
    
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-mark">Origen Spa & Bienestar</span>
        <div className="navbar-actions">
          <div className="navbar-staff-dropdown">
            <button
              className="navbar-staff-link dropdown-toggle"
              onClick={() => setStaffMenuOpen(!staffMenuOpen)}
            >
              Panel Staff
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
              <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {staffMenuOpen && (
              <div className="dropdown-menu">
                <a href="/staff/leads" onClick={() => setStaffMenuOpen(false)}>
                  <span className="dropdown-icon">👥</span>
                  Leads (Negociación)
                </a>
                <a href="/staff/payers" onClick={() => setStaffMenuOpen(false)}>
                  <span className="dropdown-icon">💳</span>
                  Payers (Pagos)
                </a>
                <a href="/staff/customers" onClick={() => setStaffMenuOpen(false)}>
                  <span className="dropdown-icon">🌟</span>
                  Customers (Atención)
                </a>
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
