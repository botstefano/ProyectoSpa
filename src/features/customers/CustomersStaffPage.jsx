import { useEffect, useMemo, useState } from 'react'
import {
  isPaymentConfirmed,
  listAttentions,
  listCustomersForAttention,
  saveAttention,
  updateAttentionFollowUp,
} from './api/customersApi'
import StaffUniversalNav from '../../shared/components/StaffUniversalNav'
import { enviarEmailPostServicio } from '../../lib/emailService'

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
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
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
  const [notasAtencion, setNotasAtencion] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

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
  const isAlreadyAttended = useMemo(() => {
    return selectedHistory.some((item) => item.estado_atencion === 'completada')
  }, [selectedHistory])
  const currentAttention = useMemo(() => {
    return selectedHistory.find((item) => item.estado_atencion === 'completada') || selectedHistory[0] || null
  }, [selectedHistory])
  const kpis = useMemo(() => calculateKpis(attentions), [attentions])
  const alerts = useMemo(() => buildAlerts(customers, attentions), [customers, attentions])

  function showNotice(message, type = 'success') {
    setNotice(message)
    setNoticeType(type)
    window.clearTimeout(showNotice.timer)
    showNotice.timer = window.setTimeout(() => setNotice(''), 4600)
  }

  async function confirmAppointmentCompleted() {
    if (!selected) return
    if (!paymentConfirmed) {
      showNotice('Atención bloqueada: el cliente todavía no tiene un pago confirmado en PAYERS.', 'error')
      return
    }

    setSaving(true)
    try {
      const now = new Date()
      const startTime = new Date(now.getTime() - 60 * 60000)

      const payload = {
        id_contacto: selected.id_contacto,
        tipo_tratamiento: selected.servicio_contratado || 'Facial Hidratante',
        especialista: selected.especialista_asignado || 'María López',
        fecha_hora_inicio: startTime.toISOString(),
        fecha_hora_fin: now.toISOString(),
        duracion_planificada_min: 60,
        estado_atencion: 'completada',
        preferencias_servicio: `Aroma: ${selected.preferencias?.aroma || 'Lavanda'}. Música: ${selected.preferencias?.musica || 'Suave'}. Piel: ${selected.preferencias?.sensibilidad || 'Normal'}.`,
        notas: notasAtencion.trim() || 'Atención en cabina completada exitosamente según propuesta aceptada.',
        satisfaccion: null,
        seguimiento_enviado: false,
        fecha_seguimiento: null,
        proxima_atencion: null,
      }

      const saved = await saveAttention(payload, source)
      setAttentions((prev) => [saved, ...prev])
      showNotice('✓ ¡Atención confirmada con éxito! El cliente ya es un CUSTOMER formal. Ahora puedes enviarle su encuesta por correo.')
      setNotasAtencion('')
    } catch (error) {
      showNotice(`Error al confirmar atención: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function sendEmailFollowUp(attention) {
    if (!selected) return
    if (!selected.email) {
      showNotice('El cliente no tiene un correo electrónico registrado.', 'error')
      return
    }

    const att = attention || currentAttention
    if (!att) {
      showNotice('Debes confirmar la atención primero antes de enviar la encuesta.', 'error')
      return
    }

    setSendingEmail(true)
    try {
      const datos = {
        servicio: att.tipo_tratamiento || selected.servicio_contratado,
        especialista: att.especialista || selected.especialista_asignado,
        origen: window.location.origin
      }

      await enviarEmailPostServicio(selected.email, selected.nombre, datos)

      const updated = await updateAttentionFollowUp(
        att.id_atencion,
        { seguimiento_enviado: true, fecha_seguimiento: new Date().toISOString() },
        source,
      )

      setAttentions((prev) => prev.map((item) => item.id_atencion === updated.id_atencion ? updated : item))
      showNotice(`📧 Encuesta post-servicio y protocolo de cuidados enviados por correo a ${selected.email}`)
    } catch (error) {
      showNotice(`Error enviando correo: ${error.message}`, 'error')
    } finally {
      setSendingEmail(false)
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

  async function sendWhatsAppFollowUp(attention) {
    if (!selected) return
    const cleanTel = (selected.telefono || '').replace(/\D/g, '')
    const tel = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`
    const primerNombre = (selected.nombre || 'Cliente').split(' ')[0]
    
    let recomendaciones = '• Mantente hidratado durante el resto del día.\n• Evita duchas con agua muy caliente o saunas.\n• Regálate un tiempo de descanso para prolongar el efecto de relajación.'
    const tipo = (attention.tipo_tratamiento || '').toLowerCase()
    if (tipo.includes('facial')) {
      recomendaciones = '• Usa protector solar FPS 50+ y evita la exposición solar directa.\n• Evita maquillarte durante las próximas 12 horas.\n• Aplica tu crema hidratante antes de dormir.'
    } else if (tipo.includes('masaje') || tipo.includes('corporal')) {
      recomendaciones = '• Bebe abundante agua para favorecer la eliminación de toxinas.\n• Realiza estiramientos suaves si lo necesitas.\n• Evita actividades físicas de alto impacto hoy.'
    }

    const msg = encodeURIComponent(
      `¡Hola ${primerNombre}! 🌿 Te saluda el equipo de Origen Spa.\n\nEsperamos que hayas disfrutado al máximo tu sesión de "${attention.tipo_tratamiento}" con ${attention.especialista}.\n\n✨ Cuidados recomendados post-sesión:\n${recomendaciones}\n\n⭐ ¿Cómo calificarías tu experiencia del 1 al 5?\n¡Tu opinión nos ayuda a brindarte siempre lo mejor!`
    )

    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')

    try {
      const updated = await updateAttentionFollowUp(
        attention.id_atencion,
        { seguimiento_enviado: true, fecha_seguimiento: new Date().toISOString() },
        source,
      )
      setAttentions((prev) => prev.map((item) => item.id_atencion === updated.id_atencion ? updated : item))
      showNotice(`📲 WhatsApp enviado y seguimiento post-servicio registrado para ${selected.nombre}.`)
    } catch (error) {
      showNotice(`WhatsApp abierto, pero no se pudo actualizar el registro: ${error.message}`, 'error')
    }
  }

  async function updateCsatScore(attention, score) {
    try {
      const numScore = score === '' ? null : Number(score)
      const updated = await updateAttentionFollowUp(
        attention.id_atencion,
        { satisfaccion: numScore },
        source,
      )
      setAttentions((prev) => prev.map((item) => item.id_atencion === updated.id_atencion ? updated : item))
      showNotice(
        numScore
          ? `✓ Satisfacción registrada: ${numScore}/5 estrellas para ${selected?.nombre || 'el cliente'}.`
          : 'Satisfacción marcada como pendiente.'
      )
    } catch (error) {
      showNotice(`No se pudo actualizar la satisfacción: ${error.message}`, 'error')
    }
  }

  function sendWhatsAppReactivation(customer) {
    if (!customer) return
    const cleanTel = (customer.telefono || '').replace(/\D/g, '')
    const tel = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`
    const primerNombre = (customer.nombre || 'Cliente').split(' ')[0]
    const msg = encodeURIComponent(
      `¡Hola ${primerNombre}! 🌿 Te saluda tu equipo de Origen Spa. Ha pasado más de un mes desde tu última visita de bienestar y queremos invitarte a renovar tu energía. Te reservamos una atención preferencial para esta semana. ¿Te gustaría conocer los horarios disponibles?`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
    showNotice(`📲 Abriendo WhatsApp para reactivar a ${customer.nombre}...`)
  }

  return (
    <div className="customers-page">
      <StaffUniversalNav activePhase="customers" />

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
                    <span className="customers-eyebrow">Fase 4 · Cabina y Post-Servicio</span>
                    <h2>Cita Contratada y Control de Atención</h2>
                  </div>
                  {selected && (
                    <span className={`payment-badge ${paymentBadge(selected.estado_pago)}`}>
                      {paymentConfirmed ? <Icon name="check" size={16} /> : <Icon name="lock" size={16} />}
                      {isAlreadyAttended ? 'Atención completada' : selected.estado_pago}
                    </span>
                  )}
                </div>

                {!selected ? (
                  <div className="customers-empty">Selecciona un cliente para ver su cita y gestionar su atención.</div>
                ) : (
                  <>
                    <div className="customer-summary">
                      <div className="customer-summary-icon"><Icon name="user" size={22} /></div>
                      <div>
                        <span>Cliente</span>
                        <strong>{selected.nombre}</strong>
                        <small>ID #{selected.id_contacto} · Tel: {selected.telefono || 'Sin tel'} · {selected.email}</small>
                      </div>
                      <div>
                        <span>Servicio pactado</span>
                        <strong style={{ color: '#b7d2b9' }}>{selected.servicio_contratado}</strong>
                        <small>{selected.fecha_cita || 'Cita programada'} · {selected.duracion_estimada || '60 min'}</small>
                      </div>
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

                    {/* Ficha de la Cita Preparada desde la Propuesta y Pago */}
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'block' }}>Especialista Asignado</span>
                          <strong style={{ fontSize: '0.88rem' }}>{selected.especialista_asignado || 'María López'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'block' }}>Fecha y Horario Acordado</span>
                          <strong style={{ fontSize: '0.88rem', color: '#e8ca8f' }}>{selected.fecha_cita || 'Hoy · 16:00 hrs'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'block' }}>Duración Acordada</span>
                          <strong style={{ fontSize: '0.88rem' }}>{selected.duracion_estimada || '60 min'}</strong>
                        </div>
                      </div>

                      {/* Preferencias de Cabina precargadas del Enriquecimiento */}
                      <div style={{
                        background: 'rgba(0,0,0,0.25)',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        color: 'rgba(255,255,255,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <strong style={{ color: '#b7d2b9', fontSize: '0.76rem' }}>🌿 Preferencias clínicas y de cabina precargadas:</strong>
                        <span>• <strong>Aroma preferido:</strong> {selected.preferencias?.aroma || 'Lavanda y eucalipto'}</span>
                        <span>• <strong>Ambiente musical:</strong> {selected.preferencias?.musica || 'Suave instrumental'}</span>
                        <span>• <strong>Condición de piel / cuerpo:</strong> {selected.preferencias?.sensibilidad || 'Piel reactiva y sensible'}</span>
                      </div>
                    </div>

                    {/* Estado de atención y Botón de 1-Clic */}
                    <div style={{ marginTop: '1.2rem' }}>
                      {!isAlreadyAttended ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)' }}>Notas del especialista (opcional):</span>
                            <input
                              type="text"
                              value={notasAtencion}
                              onChange={(e) => setNotasAtencion(e.target.value)}
                              placeholder="Ej. Tratamiento aplicado sin incidencias, piel bien hidratada..."
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#fff',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '0.78rem'
                              }}
                              disabled={!paymentConfirmed}
                            />
                          </label>

                          <button
                            type="button"
                            className="customers-primary"
                            onClick={confirmAppointmentCompleted}
                            disabled={!paymentConfirmed || saving}
                            style={{
                              padding: '12px 18px',
                              fontSize: '0.88rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              width: '100%',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                              border: '1px solid #40916c',
                              boxShadow: '0 4px 12px rgba(45, 106, 79, 0.3)'
                            }}
                          >
                            <Icon name="check" size={18} />
                            <span>{saving ? 'Confirmando...' : '✓ Confirmar Atención Realizada (Completar Cita)'}</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px 14px',
                          borderRadius: '6px',
                          background: 'rgba(183, 210, 185, 0.15)',
                          border: '1px solid rgba(183, 210, 185, 0.4)',
                          color: '#b7d2b9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Icon name="check" size={20} />
                          <div>
                            <strong>✓ Cita realizada y confirmada</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                              El cliente completó satisfactoriamente su servicio. Procede con el envío de su encuesta post-servicio.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Acciones Post-Servicio: Email (Primera Opción) y WhatsApp */}
                    {isAlreadyAttended && (
                      <div style={{
                        marginTop: '1.2rem',
                        padding: '14px',
                        borderRadius: '8px',
                        background: 'rgba(20, 38, 29, 0.7)',
                        border: '1px solid rgba(183, 210, 185, 0.25)'
                      }}>
                        <div style={{ marginBottom: '10px' }}>
                          <strong style={{ fontSize: '0.84rem', color: '#edd39e', display: 'block' }}>
                            Protocolo Post-Servicio (Encuesta CSAT y Cuidados):
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)' }}>
                            La primera opción de contacto oficial es el correo del cliente ({selected.email}).
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {/* Opción 1: Enviar por Email (Botón Principal) */}
                          <button
                            type="button"
                            onClick={() => sendEmailFollowUp(currentAttention)}
                            disabled={sendingEmail}
                            style={{
                              flex: 1,
                              minWidth: '220px',
                              padding: '10px 16px',
                              borderRadius: '6px',
                              background: '#2b503b',
                              border: '1px solid #4a8060',
                              color: '#fff',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                          >
                            <Icon name="message" size={16} />
                            <span>{sendingEmail ? 'Enviando correo...' : '📧 Enviar Encuesta y Cuidados por Correo (Opción 1)'}</span>
                          </button>

                          {/* Opción 2: Enviar por WhatsApp (Secundaria) */}
                          <button
                            type="button"
                            onClick={() => sendWhatsAppFollowUp(currentAttention)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#b7d2b9',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}
                          >
                            <Icon name="phone" size={15} />
                            <span>📲 Enviar por WhatsApp (Opción 2)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ciclo de Recompra: Generar Nueva Propuesta (Fase 2) */}
                    {isAlreadyAttended && (
                      <div style={{
                        marginTop: '1.2rem',
                        padding: '14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(232, 202, 143, 0.08) 0%, rgba(31, 48, 38, 0.4) 100%)',
                        border: '1px solid rgba(232, 202, 143, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#e8ca8f', fontSize: '1.1rem' }}>🔄</span>
                          <div>
                            <strong style={{ color: '#e8ca8f', fontSize: '0.86rem' }}>Fidelización y Ciclo de Recompra (LTV)</strong>
                            <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)' }}>
                              El cliente completó su servicio. Para que vuelva a atenderse, se crea una nueva propuesta en <strong>Fase 2 (LEADS)</strong> como cliente recurrente con historial clínico previo.
                            </p>
                          </div>
                        </div>

                        <a
                          href={`/staff/leads?cliente=${selected.id_contacto}&origen=recompra`}
                          style={{
                            marginTop: '4px',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            background: 'rgba(232, 202, 143, 0.18)',
                            border: '1px solid #e8ca8f',
                            color: '#edd39e',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            textAlign: 'center'
                          }}
                        >
                          <span>✨ Generar Nueva Propuesta de Recompra (Fase 2: LEADS) ➔</span>
                        </a>
                      </div>
                    )}
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
                    <thead><tr><th>Fecha</th><th>Tratamiento</th><th>Especialista</th><th>Duración</th><th>Estado</th><th>Satisfacción (CSAT)</th><th>Seguimiento Post-Servicio</th></tr></thead>
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
                            <td>
                              <select
                                value={item.satisfaccion ?? ''}
                                onChange={(e) => updateCsatScore(item, e.target.value)}
                                style={{
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(255,255,255,0.18)',
                                  color: item.satisfaccion ? '#b7d2b9' : 'rgba(255,255,255,0.6)',
                                  borderRadius: '4px',
                                  padding: '3px 6px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer'
                                }}
                                title="Registrar o actualizar calificación CSAT del cliente"
                              >
                                <option value="">Pendiente</option>
                                <option value="5">⭐⭐⭐⭐⭐ 5 · Excelente</option>
                                <option value="4">⭐⭐⭐⭐ 4 · Buena</option>
                                <option value="3">⭐⭐⭐ 3 · Regular</option>
                                <option value="2">⭐⭐ 2 · Baja</option>
                                <option value="1">⭐ 1 · Muy baja</option>
                              </select>
                            </td>
                            <td>
                              {item.seguimiento_enviado ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="followup-done"><Icon name="check" size={15} /> Enviado</span>
                                  <button
                                    className="customers-link-button"
                                    type="button"
                                    onClick={() => sendWhatsAppFollowUp(item)}
                                    title="Reenviar indicaciones y encuesta por WhatsApp"
                                    style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  >
                                    <Icon name="phone" size={12} />
                                    <span>Reenviar</span>
                                  </button>
                                </div>
                              ) : item.estado_atencion === 'completada' ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => sendWhatsAppFollowUp(item)}
                                    style={{
                                      background: 'rgba(183, 210, 185, 0.2)',
                                      border: '1px solid #b7d2b9',
                                      color: '#b7d2b9',
                                      borderRadius: '4px',
                                      padding: '4px 9px',
                                      cursor: 'pointer',
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontWeight: 600
                                    }}
                                    title="Enviar recomendaciones post-servicio y encuesta de satisfacción por WhatsApp"
                                  >
                                    <Icon name="phone" size={13} />
                                    <span>Enviar WhatsApp</span>
                                  </button>
                                  <button
                                    className="customers-link-button"
                                    type="button"
                                    onClick={() => markFollowUp(item)}
                                    title="Marcar como enviado manualmente"
                                    style={{ fontSize: '0.68rem' }}
                                  >
                                    Marcar
                                  </button>
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section id="alertas" className="customers-alerts-section">
              <div className="customers-section-heading">
                <span className="customers-eyebrow">Impulsamiento</span>
                <h2>Alertas y acciones sugeridas</h2>
                <p>Reglas accionables para seguimiento, recuperación y recompra.</p>
              </div>
              <div className="customers-alert-grid">
                {alerts.map((alert) => (
                  <article key={alert.id} className={`customers-alert-card ${alert.priority}`}>
                    <div className="alert-icon"><Icon name={alert.icon} size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <span>{alert.priority === 'high' ? 'Prioridad alta' : 'Prioridad media'}</span>
                      <strong>{alert.title}</strong>
                      <p>{alert.detail}</p>
                      <small>Agente: {alert.agent}</small>

                      {alert.actionType === 'link' && (
                        <a
                          href={alert.actionHref}
                          style={{
                            marginTop: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            color: '#b7d2b9',
                            textDecoration: 'none',
                            fontWeight: 600
                          }}
                        >
                          {alert.actionLabel}
                        </a>
                      )}

                      {alert.actionType === 'selectCustomer' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (alert.targetContactId) {
                              setSelectedId(alert.targetContactId)
                              showNotice('Cliente seleccionado para seguimiento post-servicio.')
                            }
                          }}
                          style={{
                            marginTop: '8px',
                            background: 'transparent',
                            border: '1px solid rgba(183, 210, 185, 0.4)',
                            color: '#b7d2b9',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            alignSelf: 'flex-start'
                          }}
                        >
                          <Icon name="message" size={13} />
                          <span>{alert.actionLabel}</span>
                        </button>
                      )}

                      {alert.actionType === 'reactivate' && alert.reactivationCustomer && (
                        <button
                          type="button"
                          onClick={() => sendWhatsAppReactivation(alert.reactivationCustomer)}
                          style={{
                            marginTop: '8px',
                            background: 'transparent',
                            border: '1px solid rgba(228, 193, 137, 0.4)',
                            color: '#e8ca8f',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            alignSelf: 'flex-start'
                          }}
                        >
                          <Icon name="phone" size={13} />
                          <span>{alert.actionLabel}</span>
                        </button>
                      )}
                    </div>
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
      actionType: 'link',
      actionHref: '/staff/payers',
      actionLabel: '➔ Ir a PAYERS para regularizar',
    })
  }

  const completedWithoutFollow = attentions.filter((item) => item.estado_atencion === 'completada' && !item.seguimiento_enviado)
  if (completedWithoutFollow.length) {
    const firstClient = customers.find(c => c.id_contacto === completedWithoutFollow[0].id_contacto)
    alerts.push({
      id: 'followup',
      priority: 'high',
      icon: 'message',
      title: `${completedWithoutFollow.length} seguimiento${completedWithoutFollow.length > 1 ? 's' : ''} pendiente${completedWithoutFollow.length > 1 ? 's' : ''}`,
      detail: 'Enviar indicaciones y encuesta dentro de las 24 horas posteriores al servicio para proteger la experiencia del cliente.',
      agent: 'Agente IA / recepción',
      actionType: 'selectCustomer',
      targetContactId: completedWithoutFollow[0].id_contacto,
      actionLabel: firstClient ? `📲 Atender a ${firstClient.nombre.split(' ')[0]}` : 'Gestionar seguimiento',
    })
  }

  const lowSatisfaction = attentions.filter((item) => Number(item.satisfaccion) > 0 && Number(item.satisfaccion) <= 2)
  if (lowSatisfaction.length) {
    const criticalClient = customers.find(c => c.id_contacto === lowSatisfaction[0].id_contacto)
    alerts.push({
      id: 'csat',
      priority: 'high',
      icon: 'alert',
      title: 'Satisfacción crítica detectada',
      detail: 'Contactar al cliente, revisar la atención y registrar una acción de recuperación del servicio.',
      agent: 'Administrador + especialista',
      actionType: 'selectCustomer',
      targetContactId: lowSatisfaction[0].id_contacto,
      actionLabel: criticalClient ? `📞 Revisar caso de ${criticalClient.nombre.split(' ')[0]}` : 'Revisar caso',
    })
  }

  const completed = attentions.filter((item) => item.estado_atencion === 'completada')
  const latestByCustomer = new Map()
  completed.forEach((item) => {
    const current = latestByCustomer.get(item.id_contacto)
    if (!current || new Date(item.fecha_hora_inicio) > new Date(current.fecha_hora_inicio)) latestByCustomer.set(item.id_contacto, item)
  })
  const now = Date.now()
  let reactivationContacts = []
  latestByCustomer.forEach((item) => {
    const days = (now - new Date(item.fecha_hora_inicio).getTime()) / 86400000
    if (days >= 30 && !item.proxima_atencion) {
      const c = customers.find(cust => cust.id_contacto === item.id_contacto)
      if (c) reactivationContacts.push(c)
    }
  })
  alerts.push({
    id: 'reactivation',
    priority: 'medium',
    icon: 'trend',
    title: reactivationContacts.length ? `${reactivationContacts.length} cliente${reactivationContacts.length > 1 ? 's' : ''} para reactivación` : 'Fidelización bajo control',
    detail: reactivationContacts.length
      ? 'No tienen próxima atención programada después de 30 días. Recomendar un servicio compatible con su historial.'
      : 'No hay clientes con más de 30 días sin próxima atención dentro de los datos actuales.',
    agent: 'Agente IA / marketing',
    actionType: reactivationContacts.length ? 'reactivate' : null,
    reactivationCustomer: reactivationContacts[0] || null,
    actionLabel: reactivationContacts.length ? `📲 Reactivar a ${reactivationContacts[0].nombre.split(' ')[0]}` : null,
  })

  return alerts.slice(0, 4)
}
