import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useStaffAuth } from './StaffAuthContext'
import BrandLogo from '../../shared/components/BrandLogo'

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
          background: 'var(--color-bg, #16231C)',
          color: 'var(--color-ink, #F3EEE2)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            background: 'var(--color-bg-alt, #1F3026)',
            padding: '2.5rem 2rem',
            borderRadius: '4px',
            border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ marginBottom: '1.2rem' }}>
            <span className="payers-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display, Fraunces, serif)',
              fontSize: '1.5rem',
              fontWeight: 500,
              margin: '0 0 0.6rem 0',
              color: 'var(--color-ink, #F3EEE2)',
            }}
          >
            Portal Interno Staff
          </h1>

          <p
            style={{
              color: 'var(--color-ink-muted, #B9C4B7)',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              marginBottom: '1.8rem',
              fontFamily: 'var(--font-body)',
            }}
          >
            Acceso restringido al personal autorizado de <strong>Origen Spa &amp; Bienestar</strong> bajo la metodología IMPULSE. Por favor, identifícate para continuar.
          </p>

          <button
            type="button"
            onClick={() => openLoginModal(location.pathname)}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '3px',
              border: 'none',
              background: 'var(--color-accent, #C89B5C)',
              color: 'var(--color-ink-on-contrast, #1B2A21)',
              fontWeight: 600,
              fontSize: '0.92rem',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              marginBottom: '1.2rem',
            }}
          >
            Iniciar sesión de personal
          </button>

          <a
            href="/"
            style={{
              display: 'inline-block',
              color: 'var(--color-ink-muted, #B9C4B7)',
              fontSize: '0.84rem',
              textDecoration: 'underline',
              fontFamily: 'var(--font-body)',
            }}
          >
            ← Volver a la página principal
          </a>
        </div>
      </div>
    )
  }

  return children
}
