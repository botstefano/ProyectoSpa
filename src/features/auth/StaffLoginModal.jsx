import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaffAuth } from './StaffAuthContext'
import BrandLogo from '../../shared/components/BrandLogo'

export default function StaffLoginModal() {
  const { loginModalOpen, closeLoginModal, login, redirectAfterLogin } = useStaffAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('spa2026')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!loginModalOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const res = login(username, password)
      setLoading(false)
      if (res.success) {
        navigate(redirectAfterLogin || '/staff/leads')
      } else {
        setError(res.error)
      }
    }, 350)
  }

  function handleQuickLogin(user, pass) {
    setUsername(user)
    setPassword(pass)
    setError('')
    setLoading(true)
    setTimeout(() => {
      const res = login(user, pass)
      setLoading(false)
      if (res.success) {
        navigate(redirectAfterLogin || '/staff/leads')
      }
    }, 300)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 18, 14, 0.85)',
        backdropFilter: 'blur(6px)',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--color-bg-alt, #1F3026)',
          borderRadius: '4px',
          border: '1px solid var(--color-line, rgba(243, 238, 226, 0.2))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          padding: '2.4rem 2rem',
          color: 'var(--color-ink, #F3EEE2)',
          position: 'relative',
        }}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={closeLoginModal}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-ink-muted, #B9C4B7)',
            fontSize: '1.3rem',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
          }}
          title="Cerrar"
        >
          ✕
        </button>

        {/* Cabecera con Logo Oficial */}
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '0.6rem' }}>
            <span className="payers-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display, Fraunces, serif)',
              fontSize: '1.35rem',
              fontWeight: 500,
              margin: '0 0 0.3rem 0',
              color: 'var(--color-ink, #F3EEE2)',
            }}
          >
            Acceso al Panel Staff
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              color: 'var(--color-ink-muted, #B9C4B7)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Origen Spa &amp; Bienestar · Metodología IMPULSE
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(217, 175, 160, 0.1)',
                border: '1px solid var(--color-clay, #D9AFA0)',
                color: 'var(--color-ink, #F3EEE2)',
                padding: '0.65rem 0.85rem',
                borderRadius: '3px',
                fontSize: '0.84rem',
                marginBottom: '1.2rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-ink-muted, #B9C4B7)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Usuario o Correo Staff
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin, recepcion o stefano"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.75rem 0.85rem',
                borderRadius: '3px',
                background: 'var(--color-bg, #16231C)',
                border: '1px solid var(--color-line, rgba(243, 238, 226, 0.2))',
                color: 'var(--color-ink, #F3EEE2)',
                fontSize: '0.92rem',
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-ink-muted, #B9C4B7)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem 2.5rem 0.75rem 0.85rem',
                  borderRadius: '3px',
                  background: 'var(--color-bg, #16231C)',
                  border: '1px solid var(--color-line, rgba(243, 238, 226, 0.2))',
                  color: 'var(--color-ink, #F3EEE2)',
                  fontSize: '0.92rem',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-ink-muted, #B9C4B7)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                }}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {loading ? 'Validando…' : 'Ingresar al sistema'}
          </button>
        </form>

        {/* Accesos rápidos discretos para pruebas */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid var(--color-line, rgba(243, 238, 226, 0.12))' }}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-ink-muted, #B9C4B7)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Accesos directos autorizados:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'spa2026')}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-line, rgba(243, 238, 226, 0.18))',
                borderRadius: '3px',
                color: 'var(--color-ink, #F3EEE2)',
                padding: '0.45rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              Admin General
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('stefano', 'admin123')}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-line, rgba(243, 238, 226, 0.18))',
                borderRadius: '3px',
                color: 'var(--color-ink, #F3EEE2)',
                padding: '0.45rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              Stefano (Sistema)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
