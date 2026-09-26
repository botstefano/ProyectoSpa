import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../../features/auth/StaffAuthContext'
import { obtenerNotificacionesPendientes } from '../../lib/notificaciones'

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
      sub: 'Negociación y Chatbot',
      path: '/staff/leads',
      icon: '👥',
    },
    {
      id: 'payers',
      label: 'Fase 3: Payers',
      sub: 'Pagos y Activación',
      path: '/staff/payers',
      icon: '💳',
    },
    {
      id: 'customers',
      label: 'Fase 4: Customers',
      sub: 'Atención y Fidelización',
      path: '/staff/customers',
      icon: '🌟',
    },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#0c1a13',
        borderBottom: '1px solid rgba(82, 183, 136, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        padding: '0 1.5rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand & Kicker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                color: '#95d5b2',
                fontSize: '1.2rem',
                border: '1px solid rgba(82, 183, 136, 0.4)',
              }}
            >
              🌿
            </span>
            <div>
              <span
                style={{
                  display: 'block',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.02em',
                }}
              >
                Origen Spa &amp; Bienestar
              </span>
              <span
                style={{
                  display: 'block',
                  color: '#74c69d',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Panel Universal Staff · IMPULSE
              </span>
            </div>
          </Link>
        </div>

        {/* Phase Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          aria-label="Navegación entre fases del Staff"
        >
          {navItems.map((item) => {
            const isActive = currentPath === item.path || activePhase === item.id
            return (
              <Link
                key={item.id}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '7px',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#b7d2b9',
                  background: isActive
                    ? 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid #52b788' : '1px solid transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(45, 106, 79, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'leads' && notificationCount > 0 && (
                  <span
                    style={{
                      background: '#e04c4c',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 6px',
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

        {/* Right Tools: Link a Buyer + Usuario Staff */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Ir al sitio Buyer */}
          <Link
            to="/"
            title="Ir a la página de clientes (Buyer)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#d8f3dc',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            <span>🌐</span>
            <span>Ver Sitio Clientes</span>
          </Link>

          {/* User profile dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(82, 183, 136, 0.3)',
                background: 'rgba(45, 106, 79, 0.25)',
                color: '#ffffff',
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#52b788',
                  color: '#0c1a13',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {(staffUser?.name || 'S').charAt(0).toUpperCase()}
              </span>
              <span style={{ fontWeight: 600 }}>{staffUser?.name || 'Staff'}</span>
              <span style={{ fontSize: '0.7rem', color: '#95d5b2' }}>▼</span>
            </button>

            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '230px',
                  background: '#132a1e',
                  border: '1px solid rgba(82, 183, 136, 0.4)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  padding: '0.6rem',
                  zIndex: 1001,
                }}
              >
                <div style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                    {staffUser?.name || 'Usuario Staff'}
                  </div>
                  <div style={{ color: '#74c69d', fontSize: '0.75rem' }}>
                    {staffUser?.role || 'Staff Origen Spa'}
                  </div>
                </div>

                <div style={{ padding: '0.4rem 0' }}>
                  <Link
                    to="/staff/leads"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.4rem 0.6rem',
                      color: '#b7d2b9',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      borderRadius: '5px',
                    }}
                  >
                    👥 Panel de Leads (Fase 2)
                  </Link>
                  <Link
                    to="/staff/payers"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.4rem 0.6rem',
                      color: '#b7d2b9',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      borderRadius: '5px',
                    }}
                  >
                    💳 Gestión de Pagos (Fase 3)
                  </Link>
                  <Link
                    to="/staff/customers"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.4rem 0.6rem',
                      color: '#b7d2b9',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      borderRadius: '5px',
                    }}
                  >
                    🌟 Atención a Clientes (Fase 4)
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.6rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff8a8a',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>🚪</span>
                    <span>Cerrar sesión de Staff</span>
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
