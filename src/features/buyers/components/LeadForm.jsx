import { useEffect, useRef, useState } from 'react'
import { registrarLead, registrarVisita } from '../api/buyersApi'

const ESTADO_INICIAL = {
  nombre: '',
  email: '',
  telefono: '',
  tipoPiel: '',
  interes: '',
}

export default function LeadForm({ selectedTreatment = '' }) {
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const idVisitaRef = useRef(null)

  useEffect(() => {
    if (selectedTreatment) {
      const lower = selectedTreatment.toLowerCase()
      let mappedInterest = 'facial'
      if (lower.includes('corporal') || lower.includes('envoltura')) mappedInterest = 'corporal'
      else if (lower.includes('masaje') || lower.includes('piedras') || lower.includes('relajante')) mappedInterest = 'relajacion'
      setForm((prev) => ({ ...prev, interes: mappedInterest }))
    }
  }, [selectedTreatment])

  useEffect(() => {
    registrarVisita().then((idVisita) => {
      idVisitaRef.current = idVisita
    })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function formProgress() {
    let filled = 0
    if (form.nombre) filled++
    if (form.email) filled++
    if (form.telefono) filled++
    if (form.tipoPiel && form.interes) filled++
    return filled
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ state: 'loading', message: '' })
    try {
      const result = await registrarLead({ ...form, idVisita: idVisitaRef.current })
      
      if (result.success) {
        setStatus({
          state: 'success',
          message: 'Listo. Te escribiremos por WhatsApp o correo con tu guía y los horarios disponibles.',
        })
        setForm(ESTADO_INICIAL)
      } else {
        setStatus({
          state: 'error',
          message: result.error?.message || 'No pudimos enviar tu solicitud. Intenta de nuevo en un momento.',
        })
      }
    } catch (err) {
      setStatus({
        state: 'error',
        message: 'No pudimos enviar tu solicitud. Intenta de nuevo en un momento.',
      })
      console.error('[LeadForm]', err)
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${formProgress()}%` }}></div>
        </div>
        <span className="progress-text">Paso {formProgress()} de 4</span>
      </div>

      <div className="field">
        <label htmlFor="nombre">Nombre completo</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Tu nombre completo"
          value={form.nombre}
          onChange={handleChange}
          className={form.nombre ? 'field-filled' : ''}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            value={form.email}
            onChange={handleChange}
            className={form.email ? 'field-filled' : ''}
          />
        </div>
        <div className="field">
          <label htmlFor="telefono">WhatsApp</label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            required
            placeholder="+51 9XX XXX XXX"
            value={form.telefono}
            onChange={handleChange}
            className={form.telefono ? 'field-filled' : ''}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="tipoPiel">Tipo de piel</label>
          <select id="tipoPiel" name="tipoPiel" required value={form.tipoPiel} onChange={handleChange} className={form.tipoPiel ? 'field-filled' : ''}>
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="grasa">Grasa</option>
            <option value="seca">Seca</option>
            <option value="mixta">Mixta</option>
            <option value="sensible">Sensible</option>
            <option value="no_se">No estoy segura</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="interes">Te interesa</label>
          <select id="interes" name="interes" required value={form.interes} onChange={handleChange} className={form.interes ? 'field-filled' : ''}>
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="facial">Tratamiento facial</option>
            <option value="corporal">Tratamiento corporal</option>
            <option value="relajacion">Relajación / masajes</option>
          </select>
        </div>
      </div>

      {selectedTreatment && (
        <div
          style={{
            margin: '0.4rem 0 1rem 0',
            padding: '0.6rem 0.9rem',
            background: 'rgba(27, 42, 33, 0.06)',
            border: '1px solid var(--color-line-contrast, rgba(27, 42, 33, 0.18))',
            borderRadius: '2px',
            fontSize: '0.85rem',
            color: 'var(--color-ink-on-contrast, #1B2A21)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Tratamiento seleccionado: <strong>{selectedTreatment}</strong>
        </div>
      )}

      <button className="btn-primary" type="submit" disabled={status.state === 'loading'}>
        {status.state === 'loading' ? (
          <span className="loading-spinner">
            <span className="spinner"></span>
            Enviando…
          </span>
        ) : 'Quiero mi guía y diagnóstico gratuito'}
      </button>

      <p className="form-note">
        🔒 Tus datos están seguros. Solo te contactaremos por WhatsApp o correo sobre tu diagnóstico. Sin spam.
      </p>

      {status.state === 'success' && (
        <div className="form-status success">
          <span className="status-icon">✓</span>
          {status.message}
        </div>
      )}
      {status.state === 'error' && (
        <div className="form-status error">
          <span className="status-icon">✕</span>
          {status.message}
        </div>
      )}
    </form>
  )
}
