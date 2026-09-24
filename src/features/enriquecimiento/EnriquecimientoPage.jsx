import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../shared/components/Navbar'
import Footer from '../../shared/components/Footer'
import { validarTokenFormato } from '../../lib/emailService'
import { requireSupabase, safeSupabaseOperation } from '../../lib/supabaseClient'
import { logger } from '../../lib/logger'

const ENRIQUECIMIENTO_FIELDS = {
  edad: '',
  distrito: '',
  ocupacion: '',
  presupuesto: '',
  disponibilidad: '',
  preferencia_aroma: '',
  preferencia_musica: '',
  sensibilidad_piel: '',
  motivo_principal: '',
  frecuencia_deseada: ''
}

const OPTIONS = {
  edad: ['18-25', '26-35', '36-45', '46-55', '55+'],
  ocupacion: ['Estudiante', 'Trabajadora', 'Hogar', 'Empresaria', 'Otra'],
  presupuesto: ['Menos de S/ 100', 'S/ 100-300', 'S/ 300-500', 'Más de S/ 500'],
  disponibilidad: ['Mañana', 'Tarde', 'Fines de semana', 'Indiferente'],
  preferencia_aroma: ['Lavanda', 'Cítrico', 'Sin aroma', 'Vainilla', 'Otro'],
  preferencia_musica: ['Relajante', 'Instrumental', 'Silencio', 'Naturaleza', 'Otro'],
  sensibilidad_piel: ['Muy sensible', 'Normal', 'Resistente'],
  motivo_principal: ['Relajación', 'Tratamiento específico', 'Bienestar', 'Evento especial', 'Otro'],
  frecuencia_deseada: ['Única', 'Mensual', 'Quincenal', 'Semanal']
}

export default function EnriquecimientoPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [validando, setValidando] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState(ENRIQUECIMIENTO_FIELDS)
  const [submitting, setSubmitting] = useState(false)
  const [progreso, setProgreso] = useState(0)

  useEffect(() => {
    async function validarToken() {
      try {
        // Validar formato del token
        if (!validarTokenFormato(token)) {
          setError('El enlace no es válido. Por favor solicita un nuevo enlace.')
          setValidando(false)
          setLoading(false)
          return
        }

        // Verificar token en base de datos
        const result = await safeSupabaseOperation(async (client) => {
          const { data, error } = await client
            .from('enriquecimiento_contacto')
            .select('id_contacto, completado, creado_at')
            .eq('token_enriquecimiento', token)
            .single()

          if (error) throw error
          return data
        }, null)

        if (!result) {
          setError('No se encontró el formulario solicitado. Contacta al staff.')
          setValidando(false)
          setLoading(false)
          return
        }

        // Verificar si ya está completado
        if (result.completado) {
          setError('Este formulario ya fue completado anteriormente.')
          setValidando(false)
          setLoading(false)
          return
        }

        // Verificar si expiró (7 días)
        const creadoEn = new Date(result.creado_at)
        const expiraEn = new Date(creadoEn.getTime() + 7 * 24 * 60 * 60 * 1000)
        if (new Date() > expiraEn) {
          setError('Este enlace ha expirado. Por favor solicita un nuevo enlace.')
          setValidando(false)
          setLoading(false)
          return
        }

        // Token válido
        setValidando(false)
        setLoading(false)
        logger.info('enriquecimiento', 'Token validado exitosamente', { idContacto: result.id_contacto })
      } catch (error) {
        logger.error('enriquecimiento', 'Error validando token', { error })
        setError('Error al validar el enlace. Por favor intenta nuevamente.')
        setValidando(false)
        setLoading(false)
      }
    }

    validarToken()
  }, [token])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Calcular progreso
    const camposLlenados = Object.values({ ...formData, [name]: value }).filter(v => v !== '').length
    const totalCampos = Object.keys(ENRIQUECIMIENTO_FIELDS).length
    setProgreso(Math.round((camposLlenados / totalCampos) * 100))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const client = requireSupabase()

      // Actualizar datos de enriquecimiento
      const { error } = await client
        .from('enriquecimiento_contacto')
        .update({
          ...formData,
          completado: true,
          fecha_completado: new Date().toISOString()
        })
        .eq('token_enriquecimiento', token)

      if (error) throw error

      logger.info('enriquecimiento', 'Formulario completado exitosamente')
      setSuccess(true)
    } catch (error) {
      logger.error('enriquecimiento', 'Error guardando formulario', { error })
      setError('Error al guardar tus datos. Por favor intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="section" style={{ 
          minHeight: '50vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}>
              <span className="spinner"></span>
            </div>
            <p style={{ color: 'var(--color-ink-muted)' }}>Validando enlace...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <section className="section">
          <div className="container section-line" style={{ paddingTop: '3.5rem' }}>
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--color-bg-alt)',
              borderRadius: '8px',
              border: '1px solid var(--color-line)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ 
                fontFamily: 'var(--font-display)',
                color: 'var(--color-clay)', 
                marginBottom: '1rem' 
              }}>Enlace no válido</h2>
              <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>{error}</p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  if (success) {
    return (
      <>
        <Navbar />
        <section className="section">
          <div className="container section-line" style={{ paddingTop: '3.5rem' }}>
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--color-bg-alt)',
              borderRadius: '8px',
              border: '1px solid var(--color-line)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ 
                fontFamily: 'var(--font-display)',
                color: '#b7d2b9', 
                marginBottom: '1rem' 
              }}>¡Perfil Completado!</h2>
              <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>
                Gracias por completar tu perfil. Nuestro equipo podrá ofrecerte un servicio 
                más personalizado adaptado a tus preferencias.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <section className="section">
        <div className="container section-line" style={{ paddingTop: '3.5rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem'
            }}>
              <h1 style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Completa tu Perfil
              </h1>
              <p style={{ 
                color: 'var(--color-ink-muted)', 
                fontSize: '1.1rem',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Ayúdanos a conocerte mejor para ofrecerte una experiencia personalizada
              </p>
            </div>

        {/* Progreso */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--color-ink-muted)'
          }}>
            <span>Progreso del formulario</span>
            <span>{progreso}%</span>
          </div>
          <div style={{ 
            height: '4px', 
            background: 'rgba(243, 238, 226, 0.1)', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--color-accent)', 
              width: `${progreso}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Sección 1: Datos Demográficos */}
          <section className="form-section">
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              marginBottom: '1.5rem',
              color: 'var(--color-accent)'
            }}>
              Datos Personales
            </h3>
            <div className="customers-form-grid">
              <div className="form-field">
                <label>Rango de edad</label>
                <select
                  name="edad"
                  value={formData.edad}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu rango de edad</option>
                  {OPTIONS.edad.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Distrito</label>
                <input
                  type="text"
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleChange}
                  placeholder="Ej: San Miguel, Miraflores..."
                  required
                />
              </div>

              <div className="form-field">
                <label>Ocupación</label>
                <select
                  name="ocupacion"
                  value={formData.ocupacion}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu ocupación</option>
                  {OPTIONS.ocupacion.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Sección 2: Presupuesto y Disponibilidad */}
          <section>
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              marginBottom: '1.5rem',
              color: 'var(--color-accent)'
            }}>
              Presupuesto y Disponibilidad
            </h3>
            <div className="customers-form-grid">
              <div className="form-field">
                <label>Rango de presupuesto</label>
                <select
                  name="presupuesto"
                  value={formData.presupuesto}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu rango de presupuesto</option>
                  {OPTIONS.presupuesto.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Disponibilidad horaria</label>
                <select
                  name="disponibilidad"
                  value={formData.disponibilidad}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu disponibilidad</option>
                  {OPTIONS.disponibilidad.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Sección 3: Preferencias */}
          <section>
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              marginBottom: '1.5rem',
              color: 'var(--color-accent)'
            }}>
              Preferencias de Servicio
            </h3>
            <div className="customers-form-grid">
              <div className="form-field">
                <label>Preferencia de aroma</label>
                <select
                  name="preferencia_aroma"
                  value={formData.preferencia_aroma}
                  onChange={handleChange}
                >
                  <option value="">Selecciona aroma preferido</option>
                  {OPTIONS.preferencia_aroma.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Preferencia de música</label>
                <select
                  name="preferencia_musica"
                  value={formData.preferencia_musica}
                  onChange={handleChange}
                >
                  <option value="">Selecciona música preferida</option>
                  {OPTIONS.preferencia_musica.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Sensibilidad de piel</label>
                <select
                  name="sensibilidad_piel"
                  value={formData.sensibilidad_piel}
                  onChange={handleChange}
                >
                  <option value="">Selecciona sensibilidad</option>
                  {OPTIONS.sensibilidad_piel.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Sección 4: Motivación */}
          <section>
            <h3 style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              marginBottom: '1.5rem',
              color: 'var(--color-accent)'
            }}>
              Motivación y Frecuencia
            </h3>
            <div className="customers-form-grid">
              <div className="form-field">
                <label>Motivo principal</label>
                <select
                  name="motivo_principal"
                  value={formData.motivo_principal}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona tu motivo principal</option>
                  {OPTIONS.motivo_principal.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Frecuencia deseada</label>
                <select
                  name="frecuencia_deseada"
                  value={formData.frecuencia_deseada}
                  onChange={handleChange}
                >
                  <option value="">Selecciona frecuencia deseada</option>
                  {OPTIONS.frecuencia_deseada.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Botón de envío */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
                minWidth: '200px'
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                  Guardando...
                </span>
              ) : 'Completar mi perfil'}
            </button>
          </div>
        </form>

        {/* Info adicional */}
        <div style={{ 
          marginTop: '3rem', 
          padding: '1.5rem', 
          background: 'rgba(200, 155, 92, 0.1)', 
          borderRadius: '6px',
          border: '1px solid rgba(200, 155, 92, 0.3)',
          fontSize: '0.9rem',
          color: 'var(--color-ink-muted)'
        }}>
          <p style={{ margin: 0 }}>
            <strong>🔒 Tus datos están seguros.</strong> Solo serán utilizados para personalizar tu experiencia en Origen Spa & Bienestar.
          </p>
        </div>
      </div>
        </div>
      </section>
      <Footer />
    </>
  )
}