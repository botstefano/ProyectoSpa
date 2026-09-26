import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useStaffAuth } from './StaffAuthContext'

export default function StaffProtectedRoute({ children }) {
  const { isAuthenticated, openLoginModal } = useStaffAuth()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      openLoginModal(location.pathname)
    }
  }, [isAuthenticated, location.pathname])

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0d1e16 0%, #06110c 100%)',
          color: '#edf2f4',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '2.5rem',
            borderRadius: '20px',
            border: '1px solid rgba(82, 183, 136, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8f9fa' }}>
            Portal Interno Staff
          </h1>
          <p style={{ color: '#b7d2b9', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
            Esta sección contiene información comercial, financiera y clínica de <strong>Origen Spa</strong> bajo la metodología IMPULSE. Se requiere autenticación de personal para acceder.
          </p>

          <button
            type="button"
            onClick={() => openLoginModal(location.pathname)}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
              borderTop: '1px solid #52b788',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(45, 106, 79, 0.4)',
              marginBottom: '1rem',
            }}
          >
            🔐 Iniciar sesión como Staff
          </button>

          <a
            href="/"
            style={{
              display: 'inline-block',
              color: '#95d5b2',
              fontSize: '0.85rem',
              textDecoration: 'none',
              marginTop: '0.5rem',
            }}
          >
            ← Volver a la página principal (Clientes)
          </a>
        </div>
      </div>
    )
  }

  return children
}
