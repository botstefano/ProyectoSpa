import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../../features/auth/StaffAuthContext'
import { obtenerNotificacionesPendientes } from '../../lib/notificaciones'
import BrandLogo from './BrandLogo'

export default function StaffUniversalNav({ activePhase = '' }) {
  const { staffUser, logout } = useStaffAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationCount, setNotificationCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const currentPath = location.pathname

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notif = await obtenerNotificacionesPendientes('leads')
        setNotificationCount(notif.length)
      } catch (err) {
        console.warn('Error notificaciones staff:', err)
      }
    }
    loadNotifications()
    const timer = setInterval(loadNotifications, 30000)
    return () => clearInterval(timer)
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const navItems = [
    {
      id: 'leads',
      label: 'Fase 2: Leads',
      path: '/staff/leads',
    },
    {
      id: 'payers',
      label: 'Fase 3: Payers',
      path: '/staff/payers',
    },
    {
      id: 'customers',
      label: 'Fase 4: Customers',
      path: '/staff/customers',
    },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-bg, #16231C)',
        borderBottom: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
        padding: '0 clamp(1.25rem, 4vw, 3rem)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--content-max, 1120px)',
          margin: '0 auto',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand & Subtitle con Logo Oficial */}
        <BrandLogo href="/staff/leads" subtitle="Sistema de Gestión · IMPULSE" />

        {/* Phase Navigation Tabs - Estilo sobrio y formal */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          aria-label="Fases del sistema"
        >
          {navItems.map((item) => {
            const isActive = currentPath === item.path || activePhase === item.id
            return (
              <Link
                key={item.id}
                to={item.path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-ink, #F3EEE2)' : 'var(--color-ink-muted, #B9C4B7)',
                  background: isActive ? 'var(--color-bg-alt, #1F3026)' : 'transparent',
                  border: isActive
                    ? '1px solid var(--color-accent, #C89B5C)'
                    : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{item.label}</span>
                {item.id === 'leads' && notificationCount > 0 && (
                  <span
                    style={{
                      background: 'var(--color-accent, #C89B5C)',
                      color: 'var(--color-ink-on-contrast, #1B2A21)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '10px',
                    }}
                  >
                    {notificationCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Controles de Staff */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            title="Volver a la landing pública de clientes"
            style={{
              padding: '6px 12px',
              borderRadius: '3px',
              border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
              background: 'transparent',
              color: 'var(--color-ink-muted, #B9C4B7)',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            Vista Clientes
          </Link>

          {/* Menú de usuario staff */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '3px',
                border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
                background: 'var(--color-bg-alt, #1F3026)',
                color: 'var(--color-ink, #F3EEE2)',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--color-accent, #C89B5C)',
                }}
              />
              <span style={{ fontWeight: 600 }}>{staffUser?.name || 'Staff'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '210px',
                  background: 'var(--color-bg-alt, #1F3026)',
                  border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
                  borderRadius: '3px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
                  padding: '0.5rem 0',
                  zIndex: 1001,
                }}
              >
                <div style={{ padding: '0.5rem 0.9rem', borderBottom: '1px solid var(--color-line, rgba(243, 238, 226, 0.1))' }}>
                  <div style={{ color: 'var(--color-ink, #F3EEE2)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {staffUser?.name || 'Usuario Staff'}
                  </div>
                  <div style={{ color: 'var(--color-ink-muted, #B9C4B7)', fontSize: '0.74rem' }}>
                    {staffUser?.role || 'Staff Origen Spa'}
                  </div>
                </div>

                <div style={{ padding: '0.3rem 0' }}>
                  <Link
                    to="/staff/leads"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.45rem 0.9rem',
                      color: 'var(--color-ink, #F3EEE2)',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                    }}
                  >
                    Fase 2: Leads &amp; Negociación
                  </Link>
                  <Link
                    to="/staff/payers"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.45rem 0.9rem',
                      color: 'var(--color-ink, #F3EEE2)',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                    }}
                  >
                    Fase 3: Payers &amp; Pagos
                  </Link>
                  <Link
                    to="/staff/customers"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.45rem 0.9rem',
                      color: 'var(--color-ink, #F3EEE2)',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                    }}
                  >
                    Fase 4: Customers &amp; Atención
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid var(--color-line, rgba(243, 238, 226, 0.1))', paddingTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.9rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-clay, #D9AFA0)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
