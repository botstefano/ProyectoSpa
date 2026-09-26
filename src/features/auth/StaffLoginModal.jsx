import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaffAuth } from './StaffAuthContext'

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
    }, 400)
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
    }, 350)
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
        backgroundColor: 'rgba(10, 25, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(145deg, #183325 0%, #0d1e16 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(82, 183, 136, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(45, 106, 79, 0.25)',
          padding: '2rem',
          color: '#edf2f4',
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
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            lineHeight: 1,
          }}
          title="Cerrar"
        >
          ×
        </button>

        {/* Header del Modal */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(82, 183, 136, 0.25) 0%, rgba(45, 106, 79, 0.4) 100%)',
              border: '1px solid #52b788',
              marginBottom: '0.8rem',
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>🔐</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.3rem 0', color: '#f8f9fa' }}>
            Portal Exclusivo Staff
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#b7d2b9' }}>
            Origen Spa &amp; Bienestar · Metodología IMPULSE
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(224, 76, 76, 0.15)',
                border: '1px solid #e04c4c',
                color: '#ffb3b3',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#b7d2b9',
                marginBottom: '0.35rem',
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
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(82, 183, 136, 0.4)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.3rem', position: 'relative' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#b7d2b9',
                marginBottom: '0.35rem',
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
                  padding: '0.75rem 2.5rem 0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(82, 183, 136, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#b7d2b9',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
              borderTop: '1px solid #52b788',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 15px rgba(45, 106, 79, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Validando credenciales...' : 'Ingresar a Gestión Staff ➔'}
          </button>
        </form>

        {/* Acceso rápido para pruebas / demo */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#95d5b2', marginBottom: '0.6rem' }}>
            Accesos rápidos autorizados para el equipo:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'spa2026')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#edf2f4',
                padding: '0.45rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              👑 Admin (General)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('stefano', 'admin123')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#edf2f4',
                padding: '0.45rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              👤 Stefano (Sistema)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
