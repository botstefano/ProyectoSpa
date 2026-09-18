import { useEffect, useRef, useState } from 'react'
import { registrarLead, registrarVisita } from '../api/buyersApi'

const ESTADO_INICIAL = {
  nombre: '',
  email: '',
  telefono: '',
  tipoPiel: '',
  interes: '',
}

export default function LeadForm() {
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const idVisitaRef = useRef(null)

  useEffect(() => {
    registrarVisita().then((idVisita) => {
      idVisitaRef.current = idVisita
    })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ state: 'loading', message: '' })
    try {
      await registrarLead({ ...form, idVisita: idVisitaRef.current })
      setStatus({
        state: 'success',
        message: 'Listo. Te escribiremos por WhatsApp o correo con tu guía y los horarios disponibles.',
      })
      setForm(ESTADO_INICIAL)
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
      <div className="field">
        <label htmlFor="nombre">Nombre completo</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          value={form.nombre}
          onChange={handleChange}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
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
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="tipoPiel">Tipo de piel</label>
          <select id="tipoPiel" name="tipoPiel" required value={form.tipoPiel} onChange={handleChange}>
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
          <select id="interes" name="interes" required value={form.interes} onChange={handleChange}>
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="facial">Tratamiento facial</option>
            <option value="corporal">Tratamiento corporal</option>
            <option value="relajacion">Relajación / masajes</option>
          </select>
        </div>
      </div>

      <button className="btn-primary" type="submit" disabled={status.state === 'loading'}>
        {status.state === 'loading' ? 'Enviando…' : 'Quiero mi guía y diagnóstico gratuito'}
      </button>

      <p className="form-note">
        Al enviar aceptas que te contactemos por WhatsApp o correo sobre tu diagnóstico. Sin spam.
      </p>

      {status.state === 'success' && <p className="form-status success">{status.message}</p>}
      {status.state === 'error' && <p className="form-status error">{status.message}</p>}
    </form>
  )
}
