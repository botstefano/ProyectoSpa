import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { obtenerNotificacionesPendientes } from '../../lib/notificaciones'
import { useStaffAuth } from '../../features/auth/StaffAuthContext'
import BrandLogo from './BrandLogo'

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
        console.warn('[Navbar] Notificaciones:', error)
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
        <BrandLogo href="/" />

        <div className="navbar-actions">
          <div className="navbar-staff-dropdown" style={{ position: 'relative' }}>
            <button
              className="navbar-staff-link dropdown-toggle"
              onClick={handleStaffClick}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.88rem',
              }}
            >
              {isAuthenticated && (
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent, #C89B5C)',
                    display: 'inline-block',
                  }}
                />
              )}
              <span>{isAuthenticated ? `Staff: ${staffUser?.name?.split(' ')[0] || 'Admin'}` : 'Acceso Staff'}</span>
              {isAuthenticated && notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
              <svg
                className="dropdown-arrow"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: staffMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isAuthenticated && staffMenuOpen && (
              <div
                className="dropdown-menu"
                style={{
                  minWidth: '240px',
                  background: 'var(--color-bg-alt, #1F3026)',
                  border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
                  borderRadius: '4px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                  padding: '0.5rem 0',
                }}
              >
                <div
                  style={{
                    padding: '0.6rem 1rem',
                    borderBottom: '1px solid var(--color-line, rgba(243, 238, 226, 0.12))',
                    fontSize: '0.78rem',
                    color: 'var(--color-ink-muted, #B9C4B7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Sesión activa: <strong style={{ color: 'var(--color-ink, #F3EEE2)' }}>{staffUser?.name}</strong>
                </div>

                <Link
                  to="/staff/leads"
                  onClick={() => setStaffMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.65rem 1rem',
                    color: 'var(--color-ink, #F3EEE2)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  Fase 2: Leads &amp; Negociación
                </Link>
                <Link
                  to="/staff/payers"
                  onClick={() => setStaffMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.65rem 1rem',
                    color: 'var(--color-ink, #F3EEE2)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  Fase 3: Payers &amp; Pagos
                </Link>
                <Link
                  to="/staff/customers"
                  onClick={() => setStaffMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.65rem 1rem',
                    color: 'var(--color-ink, #F3EEE2)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                  }}
                >
                  Fase 4: Customers &amp; Atención
                </Link>

                <div style={{ borderTop: '1px solid var(--color-line, rgba(243, 238, 226, 0.12))', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
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
                      padding: '0.6rem 1rem',
                      color: 'var(--color-clay, #D9AFA0)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Cerrar sesión de personal
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
