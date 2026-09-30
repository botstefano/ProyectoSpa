import { useMemo, useState, useEffect } from 'react'
import {
  obtenerLeadsParaPago,
  crearCronogramaPagos,
  obtenerDetallesPago,
  verificarPagoConfirmado
} from './api/payersApi'
import { enviarEmailPagoSimulado, obtenerPagosContacto } from './api/pagoSimuladoApi'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import StaffUniversalNav from '../../shared/components/StaffUniversalNav'

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
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M3.5 9.5h17" />
      </>
    ),
    edit: (
      <>
        <path d="m4 16 9.8-9.8 4 4L8 20H4v-4Z" />
        <path d="m13 7 2 2" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7.4v.2" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 22 20H2L12 3Z" />
        <path d="M12 9v5M12 17.2v.2" />
      </>
    ),
    check: <path d="m6 12 4 4 8-9" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    robot: (
      <>
        <rect x="5" y="7" width="14" height="12" rx="3" />
        <path d="M9 12h.01M15 12h.01M9 16h6M12 3v4M9 3h6" />
      </>
    ),
    money: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 9h.01M18 15h.01" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 14h4" />
      </>
    ),
    bank: (
      <>
        <path d="m3 9 9-5 9 5" />
        <path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 19h18" />
      </>
    ),
    phone: (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M10 18.5h4" />
      </>
    ),
    document: (
      <>
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v5h4M8.5 12h7M8.5 16h7" />
      </>
    ),
    trend: <path d="m4 16 5-5 3 3 7-7M15 7h4v4" />,
  }

  return <svg {...common}>{paths[name] ?? null}</svg>
}

function money(value) {
  return `S/ ${value.toFixed(2)}`
}

function Step({ number, label, status, active }) {
  return (
    <div className={`payers-step ${active ? 'active' : ''} ${status === 'done' ? 'done' : ''}`}>
      <div className="payers-step-circle">
        {status === 'done' ? <Icon name="check" size={18} /> : number}
      </div>
      <span>{label}</span>
    </div>
  )
}

function extractServiceFromLead(lead) {
  if (!lead) return null
  const det = Array.isArray(lead.lead_detalle) ? lead.lead_detalle[0] : lead.lead_detalle
  const chatPropList = Array.isArray(lead.propuesta_chatbot)
    ? lead.propuesta_chatbot
    : [lead.propuesta_chatbot].filter(Boolean)
  const latestAccepted = chatPropList
    .slice()
    .sort((a, b) => (b.id_propuesta || 0) - (a.id_propuesta || 0))
    .find(p => p?.estado_propuesta === 'aceptada')?.propuesta_actual

  const prop = latestAccepted || det?.datos_propuesta || {}
  const desc = Array.isArray(lead.descarga) ? lead.descarga[0] : lead.descarga

  const parseNumber = (val, def) => {
    if (typeof val === 'number') return val
    if (!val) return def
    const cleaned = String(val).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? def : num
  }

  const precioTotal = parseNumber(prop.precio, parseNumber(prop.precioEspecial, 120))
  const precioReg = parseNumber(prop.precioRegular, precioTotal >= 120 ? precioTotal + 30 : 150)
  const descuentoMonto = Math.max(0, precioReg - precioTotal)

  const nombreServicio = prop.servicio || prop.nombre || desc?.interes || 'Servicio Spa'
  const nombreCapitalizado = nombreServicio.charAt(0).toUpperCase() + nombreServicio.slice(1)

  return {
    nombre: nombreCapitalizado,
    categoria: 'Wellness',
    duracion: prop.duracion || '60 minutos',
    fechaAtencion: new Date().toLocaleDateString('es-ES'),
    precioRegular: precioReg,
    descuento: descuentoMonto,
    total: precioTotal,
  }
}

const DEMO_PAYERS_LEADS = [
  {
    id_contacto: 101,
    nombre: 'Camila Rodríguez',
    telefono: '+51 912 345 678',
    email: 'camila.r@gmail.com',
    id_estado: 2,
    estado_contacto: { nombre_estado: 'lead' },
    lead_detalle: {
      lead_score: 87,
      propuesta_aceptada: true,
      datos_propuesta: {
        servicio: 'Ritual de relajación',
        nombre: 'Paquete Ritual Relax Premium',
        duracion: '90 min',
        precioRegular: 180,
        precioEspecial: 144,
        precio: 144
      }
    },
    descarga: { interes: 'Ritual de relajación' }
  },
  {
    id_contacto: 102,
    nombre: 'Valeria Paredes',
    telefono: '+51 923 456 789',
    email: 'v.paredes@empresa.pe',
    id_estado: 3,
    estado_contacto: { nombre_estado: 'payer' },
    lead_detalle: {
      lead_score: 74,
      propuesta_aceptada: true,
      datos_propuesta: {
        servicio: 'Masaje descontracturante',
        nombre: 'Plan Mensual Anti-Contracturas',
        duracion: '60 min',
        precioRegular: 560,
        precioEspecial: 420,
        precio: 420
      }
    },
    descarga: { interes: 'Masaje descontracturante' }
  },
  {
    id_contacto: 103,
    nombre: 'María Gonzales',
    telefono: '+51 967 890 123',
    email: 'mariagonza@gmail.com',
    id_estado: 2,
    estado_contacto: { nombre_estado: 'lead' },
    lead_detalle: {
      lead_score: 91,
      propuesta_aceptada: true,
      datos_propuesta: {
        servicio: 'Masaje de piedras calientes',
        nombre: 'Experiencia Premium Piedras Calientes',
        duracion: '100 min',
        precioRegular: 240,
        precioEspecial: 192,
        precio: 192
      }
    },
    descarga: { interes: 'Masaje de piedras calientes' }
  }
]

export default function PayersStaffPage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [service, setService] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [history, setHistory] = useState([])
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('demo')
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [sendingPaymentEmail, setSendingPaymentEmail] = useState(false)
  const [paymentToken, setPaymentToken] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const confirmedTotal = useMemo(
    () => history.filter((item) => (item.resultado || '').toLowerCase() === 'confirmado').reduce((sum, item) => sum + item.monto, 0),
    [history],
  )

  const isConfirmed = Boolean(
    (paymentDetails && ((paymentDetails.estado_pago || '').toLowerCase() === 'confirmado' || (paymentDetails.estado_pago || '').toLowerCase() === 'pagado')) ||
    history.some(item => (item.resultado || '').toLowerCase() === 'confirmado') ||
    (schedule.length > 0 && schedule[0].estado === 'Pagada')
  )

  const balance = service ? Math.max(service.total - confirmedTotal, 0) : 0
  const initialPaid = isConfirmed
  const serviceStatus = initialPaid ? 'Servicio activado' : 'Por activar'
  const paymentStatus = initialPaid ? 'Pago confirmado' : 'Pago pendiente'

  const confirmedRate = initialPaid ? 100 : 92
  const scheduleCompliance = initialPaid ? 100 : 78
  const overdueRate = initialPaid ? 0 : 8
  const pendingRate = initialPaid ? 8 : 12
  const rejectedRate =
    history.length === 0 ? 4 : Math.round((history.filter((item) => item.resultado === 'Rechazado').length / history.length) * 100)

  // Seleccionar cliente y cargar sus datos de propuesta y cronograma
  async function selectClient(lead) {
    if (!lead) return
    setSelectedClient(lead)

    const clientService = extractServiceFromLead(lead)
    setService(clientService)

    try {
      const cronograma = await crearCronogramaPagos(lead.id_contacto, clientService.nombre, clientService.total, 3)

      const detalles = await obtenerDetallesPago(lead.id_contacto)
      const isPaid = detalles && ((detalles.estado_pago || '').toLowerCase() === 'confirmado' || (detalles.estado_pago || '').toLowerCase() === 'pagado')

      // Buscar si ya tiene token de pago generado para el enlace del cliente
      try {
        const pagos = await obtenerPagosContacto(lead.id_contacto)
        if (pagos && pagos.length > 0) {
          setPaymentToken(pagos[0].token_pago)
        } else {
          setPaymentToken(null)
        }
      } catch (_) {
        setPaymentToken(null)
      }

      if (isPaid) {
        setPaymentDetails(detalles)
        setSource('supabase')
        const montoPagado = Number(detalles.monto_total) || clientService.total

        let restante = montoPagado
        setSchedule(cronograma.map((item, index) => {
          const pagada = restante >= item.monto || (index === 0 && restante > 0)
          if (pagada) restante = Math.max(0, restante - item.monto)
          return {
            id: index + 1,
            concepto: item.concepto,
            monto: item.monto,
            vencimiento: new Date(item.fecha_vencimiento).toLocaleDateString('es-ES'),
            estado: pagada ? 'Pagada' : (item.estado === 'pendiente' ? 'Pendiente' : item.estado)
          }
        }))

        setHistory([{
          id: detalles.id_pago_simulado || detalles.id_contacto || Date.now(),
          fecha: new Date(detalles.fecha_pago || Date.now()).toLocaleDateString('es-ES'),
          metodo: (detalles.metodo_pago || 'Transferencia').toUpperCase(),
          monto: montoPagado,
          resultado: 'Confirmado',
          referencia: detalles.referencia || 'Pago verificado online'
        }])
      } else {
        setPaymentDetails(detalles)
        setSchedule(cronograma.map((item, index) => ({
          id: index + 1,
          concepto: item.concepto,
          monto: item.monto,
          vencimiento: new Date(item.fecha_vencimiento).toLocaleDateString('es-ES'),
          estado: item.estado === 'pendiente' ? 'Pendiente' : item.estado
        })))
        setHistory([])
      }
    } catch (e) {
      console.error('[Payers] Error cargando detalles del cliente:', e)
    }
  }

  // Cargar clientes desde Supabase
  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true)
        console.log('[Payers] Cargando clientes para pago...')
        const leads = await obtenerLeadsParaPago()
        console.log('[Payers] Leads obtenidos:', leads.length, leads)
        
        if (leads.length > 0) {
          setClients(leads)
          setSource('supabase')
          await selectClient(leads[0])
          console.log('[Payers] Cliente cargado exitosamente:', leads[0].nombre)
        } else {
          console.log('[Payers] No hay leads de Supabase, usando demo')
          setClients(DEMO_PAYERS_LEADS)
          setSource('demo')
          await selectClient(DEMO_PAYERS_LEADS[0])
        }
      } catch (error) {
        console.warn('[Payers] Aviso cargando clientes, usando demo:', error?.message || error)
        setClients(DEMO_PAYERS_LEADS)
        setSource('demo')
        await selectClient(DEMO_PAYERS_LEADS[0])
      } finally {
        setLoading(false)
      }
    }
    
    if (isSupabaseConfigured) {
      loadClients()
    } else {
      console.log('[Payers] Supabase no configurado, usando modo demo')
      setClients(DEMO_PAYERS_LEADS)
      setSource('demo')
      selectClient(DEMO_PAYERS_LEADS[0])
      setLoading(false)
    }
  }, [])

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4200)
  }

  async function sendPaymentEmail() {
    if (!selectedClient) {
      showNotice('Selecciona un cliente primero.')
      return
    }

    if (!selectedClient.email) {
      showNotice('El cliente no tiene email registrado.')
      return
    }

    try {
      setSendingPaymentEmail(true)
      
      const datosPago = {
        monto_total: service?.total || 0,
        servicio_contratado: service?.nombre || 'Servicio general',
        tipo_comprobante: 'boleta'
      }

      const result = await enviarEmailPagoSimulado(
        selectedClient.id_contacto,
        selectedClient.email,
        selectedClient.nombre,
        datosPago
      )

      if (result.success) {
        if (result.data?.token) {
          setPaymentToken(result.data.token)
        }
        const linkManual = result.data.linkManual || `${window.location.origin}/pago/${result.data.token}`
        showNotice(
          result.data.emailEnviado 
            ? `✓ Email de pago enviado a ${selectedClient.email}. El cliente podrá completar el pago desde el enlace recibido.`
            : `Pago creado. Link manual: ${linkManual} (email no enviado - revisar configuración RESEND)`
        )
      } else {
        showNotice(`Error al enviar email: ${result.error?.message || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('[Payers] Error enviando email de pago:', error)
      showNotice(`Error al enviar email de pago: ${error.message}`)
    } finally {
      setSendingPaymentEmail(false)
    }
  }

  async function refreshPaymentStatus() {
    if (!selectedClient) return
    try {
      setCheckingPayment(true)
      const confirmado = await verificarPagoConfirmado(selectedClient.id_contacto)
      const detalles = await obtenerDetallesPago(selectedClient.id_contacto)

      if (confirmado || (detalles && (detalles.estado_pago === 'confirmado' || detalles.estado_pago === 'pagado'))) {
        setPaymentDetails(detalles)
        const clientService = service || extractServiceFromLead(selectedClient)
        const montoPagado = Number(detalles?.monto_total) || clientService.total

        setHistory([{
          id: detalles?.id_pago_simulado || detalles?.id_contacto || Date.now(),
          fecha: new Date(detalles?.fecha_pago || Date.now()).toLocaleDateString('es-ES'),
          metodo: (detalles?.metodo_pago || 'Transferencia').toUpperCase(),
          monto: montoPagado,
          resultado: 'Confirmado',
          referencia: detalles?.referencia || 'Pago verificado online'
        }])

        setSchedule(prev => prev.map((item, index) => index === 0 ? { ...item, estado: 'Pagada' } : item))
        showNotice('✓ ¡Pago confirmado detectado! El cliente completó su pago en la pasarela online.')
      } else {
        showNotice('El cliente aún no ha completado el pago en la pasarela online.')
      }
    } catch (err) {
      console.error('[Payers] Error comprobando pago:', err)
      showNotice('No se pudo verificar el estado en este momento.')
    } finally {
      setCheckingPayment(false)
    }
  }

  function copyPaymentLink() {
    if (!paymentToken) {
      showNotice('Primero presiona "Enviar email de pago al cliente" para generar el enlace.')
      return
    }
    const link = `${window.location.origin}/pago/${paymentToken}`
    navigator.clipboard.writeText(link)
    showNotice('📋 Enlace de pago copiado al portapapeles. Listo para compartir por WhatsApp.')
  }

  if (loading) {
    return (
      <div className="payers-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>Cargando sistema de pagos...</h2>
          <p>{source === 'supabase' ? 'Conectando a Supabase y cargando datos reales...' : 'Iniciando modo demo...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="payers-page">
      <StaffUniversalNav activePhase="payers" />

      <main className="payers-main">
        <section className="payers-hero">
          <div>
            <div className="payers-kicker">Sistema de Gestión · Metodología IMPULSE</div>
            <h1>PAYERS</h1>
            <p>Gestión de pagos, activación del servicio y seguimiento de cuotas.</p>
          </div>

          <div className="payers-date-card">
            <Icon name="calendar" size={20} />
            <div>
              <span>{source === 'supabase' ? 'Fecha actual' : 'Fecha de la demo'}</span>
              <strong>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>
          </div>
        </section>

        <section className="payers-stepper" aria-label="Flujo PAYERS">
          <Step number="1" label="Cliente y propuesta" status="done" />
          <Step number="2" label="Pago online del cliente" active={!initialPaid} status={initialPaid ? 'done' : undefined} />
          <Step number="3" label="Cronograma y validación" status={initialPaid ? 'done' : undefined} />
          <Step number="4" label="Servicio activado" status={initialPaid ? 'done' : undefined} />
        </section>

        <div className={`payers-note ${source === 'supabase' ? 'supabase-connected' : 'demo-mode'}`}>
          <Icon name={source === 'supabase' ? 'check' : 'info'} size={18} />
          <span>
            {source === 'supabase' 
              ? '✓ Conectado a Supabase: Operaciones reales en base de datos' 
              : '⚠ Modo demo: Operaciones simuladas en memoria local'}
          </span>
        </div>

        {clients.length === 0 && (
          <div className="payers-note" style={{ background: 'rgba(217, 175, 160, 0.1)', border: '1px solid rgba(217, 175, 160, 0.3)' }}>
            <Icon name="alert" size={18} />
            <span>No hay leads listos para proceso de pago. Requisitos: Estado 'lead' + Score ≥ 50 + Propuesta aceptada en FASE 2.</span>
          </div>
        )}

        <section className="payers-grid payers-top-grid">
          {/* TARJETA 1: CLIENTE Y SERVICIO FORMALIZADO */}
          <article className="payers-card" id="cliente">
            <div className="payers-card-title">
              <div>
                <h2>1. Cliente y Servicio Contratado</h2>
                <span className="payers-card-sub">Ficha del lead formalizado y propuesta acordada en Fase 2.</span>
              </div>
              <span className={`schedule-chip ${initialPaid ? 'paid' : ''}`}>
                {initialPaid ? '✓ Liquidado' : '⏳ Pendiente'}
              </span>
            </div>

            <div className="payers-search">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente por nombre, DNI o teléfono..."
                aria-label="Buscar cliente"
              />
              <button type="button" title="Buscar">
                <Icon name="search" size={20} />
              </button>
            </div>

            {clients.length > 0 && (
              <div style={{ marginBottom: '14px', marginTop: '4px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Leads con propuesta aceptada ({clients.length}):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {clients
                    .filter(c => {
                      if (!search.trim()) return true
                      const q = search.toLowerCase()
                      return (
                        c.nombre?.toLowerCase().includes(q) ||
                        c.telefono?.includes(q) ||
                        c.email?.toLowerCase().includes(q) ||
                        String(c.id_contacto).includes(q)
                      )
                    })
                    .map(c => {
                      const isSelected = selectedClient?.id_contacto === c.id_contacto
                      const cDet = Array.isArray(c.lead_detalle) ? c.lead_detalle[0] : c.lead_detalle
                      return (
                        <button
                          key={c.id_contacto}
                          type="button"
                          onClick={() => selectClient(c)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #b7d2b9' : '1px solid rgba(255,255,255,0.15)',
                            background: isSelected ? 'rgba(183, 210, 185, 0.22)' : 'rgba(255,255,255,0.06)',
                            color: isSelected ? '#b7d2b9' : '#fff',
                            cursor: 'pointer',
                            fontWeight: isSelected ? '600' : '400',
                            fontSize: '12.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>{c.nombre}</span>
                          {c.id_estado === 3 || c.estado_contacto?.nombre_estado === 'payer' ? (
                            <span style={{ background: '#b7d2b9', color: '#16231C', fontSize: '10px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>✓ Pagado</span>
                          ) : (
                            <span style={{ opacity: 0.7, fontSize: '11px' }}>({cDet?.lead_score || 50} pts)</span>
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {selectedClient ? (
              <>
                <div className="client-profile">
                  <div className="client-avatar" aria-hidden="true">
                    {selectedClient.nombre.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                  </div>
                  <div className="client-data">
                    <h3>{selectedClient.nombre}</h3>
                    <div className="client-meta">
                      <span><strong>ID:</strong> {selectedClient.id_contacto}</span>
                      <span><strong>Teléfono:</strong> {selectedClient.telefono || 'No provisto'}</span>
                      <span><strong>Email:</strong> {selectedClient.email || 'No provisto'}</span>
                      <span><strong>Score:</strong> {(() => {
                        const det = Array.isArray(selectedClient.lead_detalle) ? selectedClient.lead_detalle[0] : selectedClient.lead_detalle
                        return det?.lead_score ?? 'N/A'
                      })()}</span>
                    </div>
                  </div>
                </div>

                {service && (
                  <div className="service-summary" style={{ marginTop: '12px' }}>
                    <div className="service-visual" aria-hidden="true">
                      <div className="face-illustration">
                        <span />
                        <span />
                        <span />
                      </div>
                      <small>Origen Spa</small>
                    </div>

                    <div className="service-content">
                      <div className="service-head">
                        <div>
                          <h3>{service?.nombre || 'Sin servicio'}</h3>
                          <span>{service?.duracion || 'N/A'} · Categoría {service?.categoria || 'N/A'}</span>
                        </div>
                        <span className="service-state">{serviceStatus}</span>
                      </div>

                      <div className="service-date">
                        <Icon name="calendar" size={17} />
                        <span>Fecha de atención: <strong>{service?.fechaAtencion || 'Sin fecha'}</strong></span>
                      </div>

                      <div className="service-pricing">
                        <div><span>Precio regular</span><strong>{money(service?.precioRegular || 0)}</strong></div>
                        <div><span>Descuento</span><strong>- {money(service?.descuento || 0)}</strong></div>
                        <div className="service-total"><span>Total acordado</span><strong>{money(service?.total || 0)}</strong></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="client-proof" style={{ 
                  marginTop: '12px',
                  background: initialPaid ? 'rgba(183, 210, 185, 0.15)' : undefined, 
                  borderColor: initialPaid ? '#b7d2b9' : undefined 
                }}>
                  <Icon name="check" size={17} />
                  <span>
                    {initialPaid 
                      ? `✓ Pago online completado exitosamente por ${money(confirmedTotal || service?.total || 120)}. Servicio activado y habilitado para cabina en Fase 4.` 
                      : 'Lead proveniente de Fase 2 con propuesta aceptada. En espera de confirmación de pago para activación.'}
                  </span>
                </div>

                {initialPaid && (
                  <a 
                    href="/staff/customers" 
                    className="primary-payment-button"
                    style={{
                      marginTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #40916c',
                      boxShadow: '0 4px 12px rgba(45, 106, 79, 0.35)',
                    }}
                  >
                    <span>➔ Continuar a Fase 4: Atención en Clientes</span>
                  </a>
                )}
              </>
            ) : (
              <div className="client-proof">
                <Icon name="info" size={17} />
                <span>No hay leads calificados disponibles. Registra leads en Fase 2 primero.</span>
              </div>
            )}
          </article>

          {/* TARJETA 2: CONTROL DE COBRANZA Y ENLACE ONLINE */}
          <article className="payers-card" id="control-pago">
            <div className="payers-card-title">
              <div>
                <h2>2. Control de Cobranza y Enlace Online</h2>
                <span className="payers-card-sub">Gestión del enlace del cliente, canales y pasarela.</span>
              </div>
              <span className={`schedule-chip ${initialPaid ? 'paid' : ''}`}>
                {initialPaid ? '✓ Liquidado' : '⏳ Pendiente'}
              </span>
            </div>

            {/* Estado principal de la transacción online */}
            <div style={{
              background: initialPaid ? 'rgba(183, 210, 185, 0.12)' : 'rgba(232, 202, 143, 0.1)',
              border: `1px solid ${initialPaid ? 'rgba(183, 210, 185, 0.35)' : 'rgba(232, 202, 143, 0.3)'}`,
              borderRadius: '8px',
              padding: '0.9rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <Icon name={initialPaid ? 'check' : 'clock'} size={18} />
                <strong style={{ color: initialPaid ? '#b7d2b9' : '#e8ca8f', fontSize: '0.88rem' }}>
                  {initialPaid ? 'Pago completado por el cliente' : 'Pendiente de pago por el cliente'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-muted, #B9C4B7)', lineHeight: 1.45 }}>
                {initialPaid
                  ? `El cliente completó exitosamente su pago en la pasarela online por ${money(confirmedTotal || service?.total || 0)}. El comprobante fue generado y el servicio quedó habilitado.`
                  : `El cliente debe ingresar a su enlace seguro para seleccionar su método preferido (Yape/Plin, Tarjeta, Transferencia o Efectivo) y pagar ${money(service?.total || 0)}.`}
              </p>
            </div>

            {/* Acceso y compartición del enlace de pago */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>
                Enlace seguro de pago del cliente (página pública):
              </label>
              {paymentToken ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/pago/${paymentToken}`}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#F3EEE2',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    className="outline-button"
                    onClick={copyPaymentLink}
                    title="Copiar enlace de pago para compartir por WhatsApp"
                    style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '0.78rem' }}
                  >
                    Copiar
                  </button>
                  <a
                    href={`/pago/${paymentToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="outline-button"
                    title="Abrir la pasarela en una pestaña nueva"
                    style={{ padding: '8px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    Abrir ↗
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', padding: '6px 0' }}>
                  💡 Presiona <strong>"Enviar link por Correo"</strong> para generar el enlace directo del cliente.
                </div>
              )}
            </div>

            {/* Acciones de recordatorio y canales */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => {
                  if (!selectedClient) return
                  const cleanTel = (selectedClient.telefono || selectedClient.perfil?.telefono || '').replace(/\D/g, '')
                  const tel = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`
                  const primerNombre = (selectedClient.nombre || 'Cliente').split(' ')[0]
                  const link = paymentToken ? `${window.location.origin}/pago/${paymentToken}` : `${window.location.origin}/staff/payers`
                  const msg = encodeURIComponent(`¡Hola ${primerNombre}! Te saluda el equipo de Origen Spa. Te compartimos tu enlace seguro para completar el pago de tu reserva (${service?.nombre || 'Servicio Spa'}): ${link}. ¡Quedamos atentos a tu confirmación!`)
                  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
                  showNotice(`📲 Abriendo WhatsApp para enviar recordatorio a ${selectedClient.nombre}...`)
                }}
                style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
              >
                <Icon name="phone" size={15} />
                <span>Recordar por WhatsApp</span>
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={sendPaymentEmail}
                disabled={sendingPaymentEmail}
                style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
              >
                <Icon name="mail" size={15} />
                <span>{sendingPaymentEmail ? 'Enviando...' : initialPaid ? 'Reenviar comprobante' : 'Enviar link por Correo'}</span>
              </button>
            </div>

            {/* Botón para verificar en tiempo real */}
            <button
              type="button"
              className="primary-payment-button"
              onClick={refreshPaymentStatus}
              disabled={checkingPayment}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Icon name="trend" size={17} />
              {checkingPayment ? 'Consultando pasarela...' : '🔄 Comprobar si el cliente ya pagó'}
            </button>

            <p className="secure-note" style={{ marginTop: '0.75rem', fontSize: '0.72rem' }}>
              El cliente procesa su pago de manera autónoma en su dispositivo. Este panel sincroniza automáticamente los pagos completados en la base de datos.
            </p>

            {notice && <div className="payers-toast" role="status">{notice}</div>}
          </article>
        </section>

        <section className="payers-grid payers-main-grid">
          {/* TARJETA 3: CRONOGRAMA DE PAGOS Y SESIONES */}
          <article className="payers-card" id="agenda">
            <div className="payers-card-title">
              <div>
                <h2>3. Cronograma de pagos y sesiones</h2>
                <span className="payers-card-sub">Generado automáticamente según el servicio contratado.</span>
              </div>
              <span className="schedule-chip">{initialPaid ? '1 cuota pagada' : '3 cuotas pendientes'}</span>
            </div>

            <div className="table-wrap">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Fecha de vencimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.concepto}</td>
                      <td>{money(item.monto)}</td>
                      <td>{item.vencimiento}</td>
                      <td>
                        <span className={`status-pill ${item.estado.toLowerCase()}`}>
                          {item.estado === 'Pagada' && <Icon name="check" size={14} />}
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="balance-box">
              <div>
                <span>Saldo pendiente</span>
                <strong>{money(balance)}</strong>
              </div>
              <span>de {money(service?.total || 0)} contratados</span>
            </div>

            <div className="schedule-footnote">
              <Icon name="info" size={17} />
              <span>{initialPaid ? 'El servicio ya fue activado. La próxima cuota seguirá el cronograma acordado.' : 'El servicio se activa cuando se confirme el pago en la pasarela online.'}</span>
            </div>
          </article>

          {/* TARJETA 4: HISTORIAL DE PAGOS Y MÉTRICAS */}
          <article className="payers-card" id="historial">
            <div className="payers-card-title">
              <div>
                <h2>4. Historial de Pagos y Métricas</h2>
                <span className="payers-card-sub">Transacciones online y rendimiento de cobranza.</span>
              </div>
            </div>

            <div className="table-wrap">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Resultado</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        <Icon name="info" size={16} />
                        Aún no se han registrado pagos para este cliente.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id}>
                        <td>{item.fecha}</td>
                        <td>{item.metodo}</td>
                        <td>{money(item.monto)}</td>
                        <td>
                          <span className={`result-pill ${item.resultado.toLowerCase()}`}>
                            {item.resultado}
                          </span>
                        </td>
                        <td>{item.referencia}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* KPIs compactos integrados */}
            <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(243, 238, 226, 0.1)' }}>
              <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>
                Indicadores de Cobranza (KPIs en vivo):
              </span>
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                <div className="kpi-item" style={{ padding: '8px 10px' }}>
                  <span className="kpi-icon"><Icon name="trend" size={16} /></span>
                  <div><small>Tasa confirmada</small><strong>{confirmedRate}%</strong></div>
                </div>
                <div className="kpi-item" style={{ padding: '8px 10px' }}>
                  <span className="kpi-icon"><Icon name="calendar" size={16} /></span>
                  <div><small>Cumplimiento</small><strong>{scheduleCompliance}%</strong></div>
                </div>
                <div className="kpi-item" style={{ padding: '8px 10px' }}>
                  <span className="kpi-icon"><Icon name="clock" size={16} /></span>
                  <div><small>Pendientes</small><strong>{pendingRate}%</strong></div>
                </div>
                <div className="kpi-item" style={{ padding: '8px 10px' }}>
                  <span className="kpi-icon"><Icon name="money" size={16} /></span>
                  <div><small>Recaudado</small><strong>{history.length ? money(confirmedTotal) : 'S/ 0.00'}</strong></div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>

      <footer className="payers-footer">
        <span>© 2026 Origen Spa &amp; Bienestar</span>
        <span>Sistema de Gestión · PAYERS</span>
        <span>Relajación · Bienestar · Confianza</span>
      </footer>
    </div>
  )
}
