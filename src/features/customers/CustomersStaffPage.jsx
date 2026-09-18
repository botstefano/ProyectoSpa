import { useEffect, useMemo, useState } from 'react'
import {
  isPaymentConfirmed,
  listAttentions,
  listCustomersForAttention,
  saveAttention,
  updateAttentionFollowUp,
} from './api/customersApi'

const SPECIALISTS = ['María López', 'Carlos Vega', 'Lucía Fernández', 'Ana Ruiz']
const TREATMENTS = [
  { name: 'Facial hidratante', minutes: 60 },
  { name: 'Limpieza facial profunda', minutes: 60 },
  { name: 'Masaje relajante', minutes: 90 },
  { name: 'Masaje descontracturante', minutes: 60 },
  { name: 'Tratamiento corporal', minutes: 75 },
  { name: 'Diagnóstico facial', minutes: 45 },
]

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 9.5h17" /></>,
    check: <path d="m6 12 4 4 8-9" />,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />,
    alert: <><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v5M12 17.2v.2" /></>,
    trend: <path d="m4 16 5-5 3 3 7-7M15 7h4v4" />,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-4A7 7 0 0 1 3 13V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z" /></>,
    spa: <><path d="M12 20c-4-2-6-5-6-9 3 0 5 1 6 3 1-2 3-3 6-3 0 4-2 7-6 9Z" /><path d="M12 14V4M8 8c2 .3 3.3 1.5 4 3M16 8c-2 .3-3.3 1.5-4 3" /></>,
  }

  return <svg {...common}>{paths[name] ?? null}</svg>
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function minutesBetween(start, end) {
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null
  return Math.round((b - a) / 60000)
}

function hoursBetween(start, end) {
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return (b - a) / 3600000
}

function calculateKpis(attentions) {
  const completed = attentions.filter((item) => item.estado_atencion === 'completada')
  const answered = completed.filter((item) => Number(item.satisfaccion) >= 1)
  const satisfied = answered.filter((item) => Number(item.satisfaccion) >= 4)
  const csat = answered.length ? Math.round((satisfied.length / answered.length) * 100) : 0

  const deviations = completed
    .map((item) => {
      const real = minutesBetween(item.fecha_hora_inicio, item.fecha_hora_fin)
      const planned = Number(item.duracion_planificada_min)
      return real && planned ? Math.abs(real - planned) : null
    })
    .filter((value) => value !== null)
  const avgDeviation = deviations.length
    ? Math.round(deviations.reduce((sum, value) => sum + value, 0) / deviations.length)
    : 0

  const followed = completed.filter((item) => {
    if (!item.fecha_seguimiento) return false
    const hours = hoursBetween(item.fecha_hora_fin, item.fecha_seguimiento)
    return hours !== null && hours <= 24
  })
  const followUpRate = completed.length ? Math.round((followed.length / completed.length) * 100) : 0

  const byCustomer = new Map()
  completed.forEach((item) => {
    const list = byCustomer.get(item.id_contacto) ?? []
    list.push(item)
    byCustomer.set(item.id_contacto, list)
  })

  let eligible = 0
  let repurchased = 0
  byCustomer.forEach((items) => {
    const sorted = [...items].sort((a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio))
    if (sorted.length) eligible += 1
    const hasRepurchase90 = sorted.some((item, index) => {
      if (index === 0) return false
      const days = (new Date(item.fecha_hora_inicio) - new Date(sorted[index - 1].fecha_hora_inicio)) / 86400000
      return days >= 0 && days <= 90
    })
    if (hasRepurchase90) repurchased += 1
  })
  const repurchaseRate = eligible ? Math.round((repurchased / eligible) * 100) : 0

  return { csat, avgDeviation, followUpRate, repurchaseRate, completed: completed.length }
}

function kpiState(type, value) {
  if (type === 'csat') return value >= 85 ? ['Excelente', 'good'] : value >= 70 ? ['Aceptable', 'warn'] : ['Bajo', 'bad']
  if (type === 'repurchase') return value >= 35 ? ['Alta', 'good'] : value >= 20 ? ['Media', 'warn'] : ['Baja', 'bad']
  if (type === 'deviation') return value <= 10 ? ['Óptima', 'good'] : value <= 20 ? ['Aceptable', 'warn'] : ['Revisar', 'bad']
  return value >= 95 ? ['Óptimo', 'good'] : value >= 80 ? ['Aceptable', 'warn'] : ['Bajo', 'bad']
}

function paymentBadge(status) {
  return isPaymentConfirmed(status) ? 'confirmed' : 'blocked'
}

function todayLocalInput() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function CustomerList({ customers, selectedId, onSelect, query, onQuery }) {
  const visible = customers.filter((item) => {
    const haystack = `${item.nombre} ${item.telefono ?? ''} ${item.email ?? ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <section className="customers-card customers-list-card">
      <div className="customers-card-heading">
        <div>
          <span className="customers-eyebrow">Paso 1</span>
          <h2>Seleccionar cliente</h2>
        </div>
        <span className="customers-count">{visible.length}</span>
      </div>
      <label className="customers-search">
        <Icon name="search" size={18} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Buscar por nombre, teléfono o correo"
        />
      </label>
      <div className="customers-list" role="listbox" aria-label="Clientes">
        {visible.map((item) => (
          <button
            key={item.id_contacto}
            type="button"
            className={`customers-list-item ${selectedId === item.id_contacto ? 'active' : ''}`}
            onClick={() => onSelect(item.id_contacto)}
          >
            <span className="customers-avatar">{item.nombre.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span>
            <span className="customers-list-copy">
              <strong>{item.nombre}</strong>
              <small>{item.servicio_contratado}</small>
            </span>
            <span className={`payment-dot ${paymentBadge(item.estado_pago)}`} title={item.estado_pago} />
          </button>
        ))}
      </div>
    </section>
  )
}

function KpiCard({ icon, label, value, suffix, state }) {
  return (
    <article className="customers-kpi-card">
      <div className="customers-kpi-icon"><Icon name={icon} size={20} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}{suffix}</strong>
        <small className={`kpi-state ${state[1]}`}>{state[0]}</small>
      </div>
    </article>
  )
}

export default function CustomersStaffPage() {
  const [customers, setCustomers] = useState([])
  const [attentions, setAttentions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('demo')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('success')
  const [form, setForm] = useState({
    tipo_tratamiento: TREATMENTS[0].name,
    especialista: SPECIALISTS[0],
    fecha_hora_inicio: todayLocalInput(),
    fecha_hora_fin: '',
    duracion_planificada_min: TREATMENTS[0].minutes,
    estado_atencion: 'en_atencion',
    preferencias_servicio: '',
    notas: '',
    satisfaccion: '',
    proxima_atencion: '',
  })

  useEffect(() => {
    let active = true
    Promise.all([listCustomersForAttention(), listAttentions()])
      .then(([customerResult, attentionResult]) => {
        if (!active) return
        setCustomers(customerResult.data)
        setAttentions(attentionResult.data)
        setSource(customerResult.source === 'supabase' && attentionResult.source === 'supabase' ? 'supabase' : 'demo')
        const firstConfirmed = customerResult.data.find((item) => isPaymentConfirmed(item.estado_pago))
        setSelectedId(firstConfirmed?.id_contacto ?? customerResult.data[0]?.id_contacto ?? null)
      })
      .catch((error) => showNotice(error.message, 'error'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const selected = customers.find((item) => item.id_contacto === selectedId) ?? null
  const paymentConfirmed = selected ? isPaymentConfirmed(selected.estado_pago) : false
  const selectedHistory = useMemo(
    () => attentions.filter((item) => item.id_contacto === selectedId),
    [attentions, selectedId],
  )
  const kpis = useMemo(() => calculateKpis(attentions), [attentions])
  const alerts = useMemo(() => buildAlerts(customers, attentions), [customers, attentions])

  function showNotice(message, type = 'success') {
    setNotice(message)
    setNoticeType(type)
    window.clearTimeout(showNotice.timer)
    showNotice.timer = window.setTimeout(() => setNotice(''), 4600)
  }

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function changeTreatment(value) {
    const treatment = TREATMENTS.find((item) => item.name === value)
    setForm((prev) => ({
      ...prev,
      tipo_tratamiento: value,
      duracion_planificada_min: treatment?.minutes ?? prev.duracion_planificada_min,
    }))
  }

  async function registerAttention(event) {
    event.preventDefault()
    if (!selected) return
    if (!paymentConfirmed) {
      showNotice('Atención bloqueada: el cliente todavía no tiene un pago confirmado en PAYERS.', 'error')
      return
    }
    if (!form.fecha_hora_inicio || !form.tipo_tratamiento || !form.especialista) {
      showNotice('Completa tratamiento, especialista y fecha/hora de inicio.', 'error')
      return
    }

    if (form.estado_atencion === 'completada' && !form.fecha_hora_fin) {
      showNotice('Para cerrar la atención como completada debes registrar la hora de fin.', 'error')
      return
    }

    const start = new Date(form.fecha_hora_inicio)
    const end = form.fecha_hora_fin ? new Date(form.fecha_hora_fin) : null
    if (end && end <= start) {
      showNotice('La hora de fin debe ser posterior a la hora de inicio.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id_contacto: selected.id_contacto,
        tipo_tratamiento: form.tipo_tratamiento,
        especialista: form.especialista,
        fecha_hora_inicio: start.toISOString(),
        fecha_hora_fin: end ? end.toISOString() : null,
        duracion_planificada_min: Number(form.duracion_planificada_min) || null,
        estado_atencion: form.estado_atencion,
        preferencias_servicio: form.preferencias_servicio.trim() || null,
        notas: form.notas.trim() || null,
        satisfaccion: form.satisfaccion ? Number(form.satisfaccion) : null,
        seguimiento_enviado: false,
        fecha_seguimiento: null,
        proxima_atencion: form.proxima_atencion || null,
      }
      const saved = await saveAttention(payload, source)
      setAttentions((prev) => [saved, ...prev])
      showNotice(
        payload.estado_atencion === 'completada'
          ? 'Atención completada. El registro evidencia el paso de PAYER a CUSTOMER.'
          : 'Atención registrada correctamente.',
      )
      setForm((prev) => ({
        ...prev,
        fecha_hora_inicio: todayLocalInput(),
        fecha_hora_fin: '',
        estado_atencion: 'en_atencion',
        preferencias_servicio: '',
        notas: '',
        satisfaccion: '',
        proxima_atencion: '',
      }))
    } catch (error) {
      showNotice(`No se pudo guardar: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function markFollowUp(attention) {
    try {
      const updated = await updateAttentionFollowUp(
        attention.id_atencion,
        { seguimiento_enviado: true, fecha_seguimiento: new Date().toISOString() },
        source,
      )
      setAttentions((prev) => prev.map((item) => item.id_atencion === updated.id_atencion ? updated : item))
      showNotice('Seguimiento post-servicio registrado. Se considera para el KPI de 24 horas.')
    } catch (error) {
      showNotice(`No se pudo registrar el seguimiento: ${error.message}`, 'error')
    }
  }

  return (
    <div className="customers-page">
      <header className="customers-navbar">
        <div className="customers-navbar-inner">
          <a href="/" className="customers-brand">
            <span className="customers-brand-icon"><Icon name="spa" size={25} /></span>
            <span>Origen Spa &amp; Bienestar</span>
          </a>
          <nav className="customers-nav-links" aria-label="Navegación interna">
            <a href="/staff/leads">Leads</a>
            <a href="/staff/payers">Pagos</a>
            <a href="/staff/customers" className="active">Clientes</a>
          </nav>
          <div className="customers-admin"><Icon name="user" size={17} /> <span>Fase 4 · CUSTOMERS</span></div>
        </div>
      </header>

      <main className="customers-main">
        <section className="customers-hero">
          <div>
            <span className="customers-kicker">Inteligencia de Negocios · Metodología IMPULSE</span>
            <h1>CUSTOMERS</h1>
            <p>Registro de atención, seguimiento post-servicio y fidelización del cliente.</p>
          </div>
          <div className={`customers-source ${source}`}>
            <span className="source-dot" />
            {source === 'supabase' ? 'Datos conectados a Supabase' : 'Modo demo persistente'}
          </div>
        </section>

        <section className="customers-flow" aria-label="Trazabilidad del embudo">
          <div className="flow-stage muted"><span>1</span><strong>BUYER</strong><small>Captación</small></div>
          <div className="flow-line" />
          <div className="flow-stage muted"><span>2</span><strong>LEAD</strong><small>Calificación</small></div>
          <div className="flow-line" />
          <div className="flow-stage"><span>3</span><strong>PAYER</strong><small>Pago confirmado</small></div>
          <div className="flow-line active" />
          <div className="flow-stage active"><span>4</span><strong>CUSTOMER</strong><small>Servicio recibido</small></div>
        </section>

        {loading ? (
          <div className="customers-loading">Cargando módulo de atención…</div>
        ) : (
          <>
            <section id="indicadores" className="customers-kpi-grid">
              <KpiCard icon="heart" label="Satisfacción (CSAT)" value={kpis.csat} suffix="%" state={kpiState('csat', kpis.csat)} />
              <KpiCard icon="trend" label="Recompra a 90 días" value={kpis.repurchaseRate} suffix="%" state={kpiState('repurchase', kpis.repurchaseRate)} />
              <KpiCard icon="clock" label="Desviación prom. atención" value={kpis.avgDeviation} suffix=" min" state={kpiState('deviation', kpis.avgDeviation)} />
              <KpiCard icon="message" label="Seguimiento ≤ 24 h" value={kpis.followUpRate} suffix="%" state={kpiState('followup', kpis.followUpRate)} />
            </section>

            <section id="atencion" className="customers-workspace">
              <CustomerList
                customers={customers}
                selectedId={selectedId}
                onSelect={setSelectedId}
                query={query}
                onQuery={setQuery}
              />

              <section className="customers-card customers-service-card">
                <div className="customers-card-heading">
                  <div>
                    <span className="customers-eyebrow">Paso 2</span>
                    <h2>Atención / Registro de Servicio</h2>
                  </div>
                  {selected && (
                    <span className={`payment-badge ${paymentBadge(selected.estado_pago)}`}>
                      {paymentConfirmed ? <Icon name="check" size={16} /> : <Icon name="lock" size={16} />}
                      {selected.estado_pago}
                    </span>
                  )}
                </div>

                {!selected ? (
                  <div className="customers-empty">Selecciona un cliente para continuar.</div>
                ) : (
                  <>
                    <div className="customer-summary">
                      <div className="customer-summary-icon"><Icon name="user" size={22} /></div>
                      <div><span>Cliente</span><strong>{selected.nombre}</strong><small>ID #{selected.id_contacto} · {selected.email}</small></div>
                      <div><span>Servicio contratado</span><strong>{selected.servicio_contratado}</strong><small>Pago: {selected.fecha_pago ?? 'sin fecha'}</small></div>
                    </div>

                    {!paymentConfirmed && (
                      <div className="customers-blocked-message">
                        <Icon name="lock" size={20} />
                        <div>
                          <strong>Atención bloqueada por regla de negocio</strong>
                          <p>El contacto todavía no tiene pago confirmado. Debe regularizarse en la Fase 3 (PAYERS) antes de registrar el servicio.</p>
                        </div>
                      </div>
                    )}

                    <form className={`customers-form ${!paymentConfirmed ? 'disabled' : ''}`} onSubmit={registerAttention}>
                      <div className="customers-form-grid">
                        <label><span>Tratamiento</span><select value={form.tipo_tratamiento} onChange={(e) => changeTreatment(e.target.value)} disabled={!paymentConfirmed}>{TREATMENTS.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
                        <label><span>Especialista</span><select value={form.especialista} onChange={(e) => setField('especialista', e.target.value)} disabled={!paymentConfirmed}>{SPECIALISTS.map((name) => <option key={name}>{name}</option>)}</select></label>
                        <label><span>Inicio de atención</span><input type="datetime-local" value={form.fecha_hora_inicio} onChange={(e) => setField('fecha_hora_inicio', e.target.value)} disabled={!paymentConfirmed} /></label>
                        <label><span>Fin de atención</span><input type="datetime-local" value={form.fecha_hora_fin} onChange={(e) => setField('fecha_hora_fin', e.target.value)} disabled={!paymentConfirmed} /></label>
                        <label><span>Duración planificada (min)</span><input type="number" min="10" max="240" value={form.duracion_planificada_min} onChange={(e) => setField('duracion_planificada_min', e.target.value)} disabled={!paymentConfirmed} /></label>
                        <label><span>Estado</span><select value={form.estado_atencion} onChange={(e) => setField('estado_atencion', e.target.value)} disabled={!paymentConfirmed}><option value="programada">Programada</option><option value="en_atencion">En atención</option><option value="completada">Completada</option><option value="no_asistio">No asistió</option></select></label>
                        <label className="span-2"><span>Preferencias del servicio</span><input value={form.preferencias_servicio} onChange={(e) => setField('preferencias_servicio', e.target.value)} placeholder="Ej. aroma lavanda, música suave, sensibilidad de piel…" disabled={!paymentConfirmed} /></label>
                        <label className="span-2"><span>Notas / observaciones del especialista</span><textarea rows="3" value={form.notas} onChange={(e) => setField('notas', e.target.value)} placeholder="Incidencias, recomendaciones, reacción al tratamiento…" disabled={!paymentConfirmed} /></label>
                        <label><span>Satisfacción (1–5)</span><select value={form.satisfaccion} onChange={(e) => setField('satisfaccion', e.target.value)} disabled={!paymentConfirmed}><option value="">Pendiente</option><option value="5">5 · Excelente</option><option value="4">4 · Buena</option><option value="3">3 · Regular</option><option value="2">2 · Baja</option><option value="1">1 · Muy baja</option></select></label>
                        <label><span>Próxima atención sugerida</span><input type="date" value={form.proxima_atencion} onChange={(e) => setField('proxima_atencion', e.target.value)} disabled={!paymentConfirmed} /></label>
                      </div>
                      <div className="customers-form-actions">
                        <div className="customers-business-rule"><Icon name="check" size={16} /><span>Al cerrar como <strong>Completada</strong>, el sistema evidencia PAYER → CUSTOMER.</span></div>
                        <button className="customers-primary" type="submit" disabled={!paymentConfirmed || saving}>{saving ? 'Guardando…' : 'Guardar atención'}</button>
                      </div>
                    </form>
                  </>
                )}
              </section>
            </section>

            <section id="historial" className="customers-card customers-history-card">
              <div className="customers-card-heading">
                <div><span className="customers-eyebrow">Evidencia transaccional</span><h2>Historial de atención</h2></div>
                <span className="customers-count">{selectedHistory.length}</span>
              </div>
              {selectedHistory.length === 0 ? (
                <div className="customers-empty">Este contacto aún no tiene servicios registrados en CUSTOMERS.</div>
              ) : (
                <div className="customers-table-wrap">
                  <table className="customers-table">
                    <thead><tr><th>Fecha</th><th>Tratamiento</th><th>Especialista</th><th>Duración</th><th>Estado</th><th>CSAT</th><th>Seguimiento</th></tr></thead>
                    <tbody>
                      {selectedHistory.map((item) => {
                        const realMinutes = minutesBetween(item.fecha_hora_inicio, item.fecha_hora_fin)
                        return (
                          <tr key={item.id_atencion}>
                            <td>{formatDateTime(item.fecha_hora_inicio)}</td>
                            <td>{item.tipo_tratamiento}</td>
                            <td>{item.especialista}</td>
                            <td>{realMinutes ? `${realMinutes} min` : '—'}</td>
                            <td><span className={`attention-status ${item.estado_atencion}`}>{item.estado_atencion.replaceAll('_', ' ')}</span></td>
                            <td>{item.satisfaccion ? `${item.satisfaccion}/5` : 'Pendiente'}</td>
                            <td>{item.seguimiento_enviado ? <span className="followup-done"><Icon name="check" size={15} /> Enviado</span> : item.estado_atencion === 'completada' ? <button className="customers-link-button" type="button" onClick={() => markFollowUp(item)}>Registrar ahora</button> : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section id="alertas" className="customers-alerts-section">
              <div className="customers-section-heading"><span className="customers-eyebrow">Impulsamiento</span><h2>Alertas y acciones sugeridas</h2><p>Reglas accionables para seguimiento, recuperación y recompra.</p></div>
              <div className="customers-alert-grid">
                {alerts.map((alert) => (
                  <article key={alert.id} className={`customers-alert-card ${alert.priority}`}>
                    <div className="alert-icon"><Icon name={alert.icon} size={20} /></div>
                    <div><span>{alert.priority === 'high' ? 'Prioridad alta' : 'Prioridad media'}</span><strong>{alert.title}</strong><p>{alert.detail}</p><small>Agente: {alert.agent}</small></div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {notice && <div className={`customers-toast ${noticeType}`}>{notice}</div>}
      <footer className="customers-footer"><span>ORIGEN SPA &amp; BIENESTAR · Fase 4 CUSTOMERS</span><span>Atención · Seguimiento · Fidelización</span></footer>
    </div>
  )
}

function buildAlerts(customers, attentions) {
  const alerts = []
  const pending = customers.filter((item) => !isPaymentConfirmed(item.estado_pago))
  if (pending.length) {
    alerts.push({
      id: 'payment',
      priority: 'high',
      icon: 'lock',
      title: `${pending.length} cliente${pending.length > 1 ? 's' : ''} con atención bloqueada`,
      detail: 'El registro del servicio debe permanecer bloqueado hasta que PAYERS confirme el pago.',
      agent: 'Recepción + Fase 3',
    })
  }

  const completedWithoutFollow = attentions.filter((item) => item.estado_atencion === 'completada' && !item.seguimiento_enviado)
  if (completedWithoutFollow.length) {
    alerts.push({
      id: 'followup',
      priority: 'high',
      icon: 'message',
      title: `${completedWithoutFollow.length} seguimiento${completedWithoutFollow.length > 1 ? 's' : ''} pendiente${completedWithoutFollow.length > 1 ? 's' : ''}`,
      detail: 'Enviar indicaciones y encuesta dentro de las 24 horas posteriores al servicio para proteger la experiencia del cliente.',
      agent: 'Agente IA / recepción',
    })
  }

  const lowSatisfaction = attentions.filter((item) => Number(item.satisfaccion) > 0 && Number(item.satisfaccion) <= 2)
  if (lowSatisfaction.length) {
    alerts.push({
      id: 'csat',
      priority: 'high',
      icon: 'alert',
      title: 'Satisfacción crítica detectada',
      detail: 'Contactar al cliente, revisar la atención y registrar una acción de recuperación del servicio.',
      agent: 'Administrador + especialista',
    })
  }

  const completed = attentions.filter((item) => item.estado_atencion === 'completada')
  const latestByCustomer = new Map()
  completed.forEach((item) => {
    const current = latestByCustomer.get(item.id_contacto)
    if (!current || new Date(item.fecha_hora_inicio) > new Date(current.fecha_hora_inicio)) latestByCustomer.set(item.id_contacto, item)
  })
  const now = Date.now()
  let reactivation = 0
  latestByCustomer.forEach((item) => {
    const days = (now - new Date(item.fecha_hora_inicio).getTime()) / 86400000
    if (days >= 30 && !item.proxima_atencion) reactivation += 1
  })
  alerts.push({
    id: 'reactivation',
    priority: 'medium',
    icon: 'trend',
    title: reactivation ? `${reactivation} cliente${reactivation > 1 ? 's' : ''} para reactivación` : 'Fidelización bajo control',
    detail: reactivation
      ? 'No tienen próxima atención programada después de 30 días. Recomendar un servicio compatible con su historial.'
      : 'No hay clientes con más de 30 días sin próxima atención dentro de los datos actuales.',
    agent: 'Agente IA / marketing',
  })

  return alerts.slice(0, 4)
}
