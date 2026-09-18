import { useMemo, useState } from 'react'

const INITIAL_CLIENT = {
  id_contacto: 125,
  nombre: 'Camila Rodríguez Salas',
  dni: '74859632',
  telefono: '987 654 321',
  email: 'camila.rodriguez@gmail.com',
  estadoFase2: 'Propuesta aceptada',
}

const INITIAL_SERVICE = {
  nombre: 'Facial Hidratante',
  categoria: 'Facial',
  duracion: '60 minutos',
  fechaAtencion: '25/09/2026',
  precioRegular: 150,
  descuento: 20,
  total: 130,
}

const INITIAL_SCHEDULE = [
  { id: 1, concepto: 'Pago inicial', monto: 50, vencimiento: '17/09/2026', estado: 'Pendiente' },
  { id: 2, concepto: 'Cuota 2', monto: 40, vencimiento: '01/10/2026', estado: 'Pendiente' },
  { id: 3, concepto: 'Cuota 3', monto: 40, vencimiento: '15/10/2026', estado: 'Pendiente' },
]

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { id: 'tarjeta', label: 'Tarjeta', icon: 'card' },
  { id: 'transferencia', label: 'Transferencia', icon: 'bank' },
  { id: 'yape-plin', label: 'Yape / Plin', icon: 'phone' },
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

function MethodIcon({ name }) {
  return (
    <span className="payment-method-icon">
      <Icon name={name} size={22} />
    </span>
  )
}

export default function PayersStaffPage() {
  const [client] = useState(INITIAL_CLIENT)
  const [service] = useState(INITIAL_SERVICE)
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE)
  const [selectedMethod, setSelectedMethod] = useState('yape-plin')
  const [amount, setAmount] = useState('50')
  const [reference, setReference] = useState('')
  const [result, setResult] = useState('confirmado')
  const [history, setHistory] = useState([])
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')

  const confirmedTotal = useMemo(
    () => history.filter((item) => item.resultado === 'Confirmado').reduce((sum, item) => sum + item.monto, 0),
    [history],
  )

  const balance = Math.max(service.total - confirmedTotal, 0)
  const initialPaid = schedule[0].estado === 'Pagada'
  const serviceStatus = initialPaid ? 'Servicio activado' : 'Por activar'
  const paymentStatus = initialPaid ? 'Pago confirmado' : 'Pago pendiente'

  const confirmedRate = initialPaid ? 100 : 92
  const scheduleCompliance = initialPaid ? 100 : 78
  const overdueRate = initialPaid ? 0 : 8
  const pendingRate = initialPaid ? 8 : 12
  const rejectedRate =
    history.length === 0 ? 4 : Math.round((history.filter((item) => item.resultado === 'Rechazado').length / history.length) * 100)

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4200)
  }

  function registerPayment() {
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showNotice('Ingresa un monto válido mayor a S/ 0.00.')
      return
    }

    if (numericAmount > balance) {
      showNotice(`El monto supera el saldo pendiente de ${money(balance)}.`)
      return
    }

    const methodLabel = PAYMENT_METHODS.find((method) => method.id === selectedMethod)?.label ?? selectedMethod
    const paymentDate = '17/09/2026'
    const transaction = {
      id: Date.now(),
      fecha: paymentDate,
      metodo: methodLabel,
      monto: numericAmount,
      resultado: result === 'confirmado' ? 'Confirmado' : result === 'rechazado' ? 'Rechazado' : 'Pendiente',
      referencia: reference.trim() || '—',
    }

    setHistory((prev) => [transaction, ...prev])

    if (transaction.resultado === 'Confirmado') {
      let remaining = numericAmount
      const nextSchedule = schedule.map((item) => {
        if (item.estado !== 'Pagada' && remaining >= item.monto) {
          remaining -= item.monto
          return { ...item, estado: 'Pagada' }
        }
        return item
      })
      setSchedule(nextSchedule)
      showNotice('Pago confirmado. La reserva quedó habilitada y el servicio se activó correctamente.')
    } else if (transaction.resultado === 'Rechazado') {
      showNotice('Pago rechazado. El servicio permanece pendiente de activación.')
    } else {
      showNotice('Pago registrado como pendiente de validación.')
    }

    setReference('')
  }

  function confirmService() {
    showNotice('La contratación quedó formalizada. La constancia digital está lista para la demo.')
  }

  function generateReceipt() {
    if (history.length === 0) {
      showNotice('Primero registra un pago para generar su comprobante de demo.')
      return
    }
    showNotice('Comprobante/constancia generado en modo demo.')
  }

  return (
    <div className="payers-page">
      <header className="payers-navbar">
        <div className="payers-navbar-inner">
          <a href="/" className="payers-brand" aria-label="Volver a la página principal">
            <span className="payers-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Origen Spa &amp; Bienestar</span>
          </a>

          <nav className="payers-nav-links" aria-label="Navegación interna">
            <a href="/">Inicio</a>
            <a href="#cliente">Clientes</a>
            <a href="#servicio">Servicios</a>
            <a href="#agenda">Citas</a>
            <a href="#indicadores">Reportes</a>
          </nav>

          <div className="payers-user-tools">
            <button className="icon-button" type="button" title="Alertas">
              <Icon name="bell" size={21} />
              <span className="notification-dot">3</span>
            </button>
            <span className="payers-divider" />
            <button className="payers-admin" type="button">
              <span className="avatar"><Icon name="user" size={18} /></span>
              <span>Admin</span>
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="payers-main">
        <section className="payers-hero">
          <div>
            <div className="payers-kicker">Sistema de Gestión · Metodología IMPULSE</div>
            <h1>Fase 3: PAYERS</h1>
            <p>Gestión de pagos, activación del servicio y seguimiento de cuotas.</p>
          </div>

          <div className="payers-date-card">
            <Icon name="calendar" size={20} />
            <div>
              <span>Fecha de la demo</span>
              <strong>Miércoles, 17 de septiembre de 2026</strong>
            </div>
          </div>
        </section>

        <section className="payers-stepper" aria-label="Flujo PAYERS">
          <Step number="1" label="Confirmación del servicio" status="done" />
          <Step number="2" label="Formalización de la contratación" status="done" />
          <Step number="3" label="Registro de pago" active />
          <Step number="4" label="Validación" />
          <Step number="5" label="Servicio activado" status={initialPaid ? 'done' : undefined} />
        </section>

        <div className="payers-note">
          <Icon name="info" size={18} />
          <span>Modo demo: el registro de pagos se mantiene en memoria para que puedas ejecutar y presentar el flujo sin configurar Supabase.</span>
        </div>

        <section className="payers-grid payers-top-grid">
          <article className="payers-card" id="cliente">
            <div className="payers-card-title">
              <h2>1. Datos del cliente</h2>
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

            <div className="client-profile">
              <div className="client-avatar" aria-hidden="true">CR</div>
              <div className="client-data">
                <h3>{client.nombre}</h3>
                <div className="client-meta">
                  <span><strong>ID Contacto:</strong> {client.id_contacto}</span>
                  <span><strong>DNI:</strong> {client.dni}</span>
                  <span><strong>Teléfono:</strong> {client.telefono}</span>
                  <span><strong>Email:</strong> {client.email}</span>
                </div>
                <div className="phase-status">
                  <span>Estado Fase 2:</span>
                  <b>{client.estadoFase2}</b>
                </div>
              </div>
            </div>

            <div className="client-proof">
              <Icon name="check" size={17} />
              <span>Lead proveniente de Fase 2 con propuesta aceptada y cita agendada.</span>
            </div>
          </article>

          <article className="payers-card" id="servicio">
            <div className="payers-card-title">
              <h2>2. Servicio contratado</h2>
              <button className="outline-button" type="button" onClick={() => showNotice('Edición controlada del servicio: disponible en la demo visual.')}>
                <Icon name="edit" size={16} /> Editar
              </button>
            </div>

            <div className="service-summary">
              <div className="service-visual" aria-hidden="true">
                <div className="face-illustration">
                  <span />
                  <span />
                  <span />
                </div>
                <small>Origen Wellness</small>
              </div>

              <div className="service-content">
                <div className="service-head">
                  <div>
                    <h3>{service.nombre}</h3>
                    <span>{service.duracion} · Categoría {service.categoria}</span>
                  </div>
                  <span className="service-state">{serviceStatus}</span>
                </div>

                <div className="service-date">
                  <Icon name="calendar" size={17} />
                  <span>Fecha de atención: <strong>{service.fechaAtencion}</strong></span>
                </div>

                <div className="service-pricing">
                  <div><span>Precio regular</span><strong>{money(service.precioRegular)}</strong></div>
                  <div><span>Descuento</span><strong>- {money(service.descuento)}</strong></div>
                  <div className="service-total"><span>Total del servicio</span><strong>{money(service.total)}</strong></div>
                </div>
              </div>
            </div>

            <button className="secondary-cta" type="button" onClick={confirmService}>
              <Icon name="check" size={17} />
              Confirmar contratación y generar constancia
            </button>
          </article>
        </section>

        <section className="payers-grid payers-main-grid">
          <div className="payers-left-column">
            <article className="payers-card" id="agenda">
              <div className="payers-card-title">
                <div>
                  <h2>3. Cronograma de pagos</h2>
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
                <span>de {money(service.total)} contratados</span>
              </div>

              <div className="schedule-footnote">
                <Icon name="info" size={17} />
                <span>{initialPaid ? 'El servicio ya fue activado. La próxima cuota seguirá el cronograma.' : 'El servicio se activa cuando se confirme el pago inicial.'}</span>
              </div>
            </article>

            <article className="payers-card">
              <div className="payers-card-title">
                <div>
                  <h2>4. Historial de pagos</h2>
                  <span className="payers-card-sub">Intentos y resultados registrados en la sesión.</span>
                </div>
                <button className="text-button" type="button" onClick={generateReceipt}>Generar comprobante</button>
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
                          Aún no se han registrado pagos.
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
            </article>

            <article className="payers-card">
              <div className="payers-card-title">
                <div>
                  <h2>5. Agente y alertas de impulsamiento</h2>
                  <span className="payers-card-sub">Seguimiento automatizado del cronograma.</span>
                </div>
              </div>

              <div className="agent-alert-grid">
                <div className="agent-box">
                  <div className="agent-icon">
                    <Icon name="robot" size={23} />
                  </div>
                  <div>
                    <h3>Agente IA de cobranza</h3>
                    <p>Monitorea cuotas, vencimientos y pagos pendientes.</p>
                    <ul>
                      <li>Envía recordatorios por WhatsApp/email.</li>
                      <li>Detecta cuotas vencidas y pendientes.</li>
                      <li>Escala casos que requieren atención humana.</li>
                    </ul>
                  </div>
                </div>

                <div className={`alert-box ${initialPaid ? 'success' : ''}`}>
                  <div className="alert-icon"><Icon name={initialPaid ? 'check' : 'alert'} size={21} /></div>
                  <div>
                    <h3>{initialPaid ? 'Seguimiento programado' : 'Alerta de impulsamiento'}</h3>
                    {initialPaid ? (
                      <p>Próxima cuota: 01/10/2026 → recordatorio automático 2 días antes.</p>
                    ) : (
                      <p>Pago inicial pendiente → recordatorio automático antes del vencimiento.</p>
                    )}
                    <span className="alert-action">{initialPaid ? 'Flujo activo' : 'Acción sugerida: regularizar pago'}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="payers-right-column">
            <article className="payers-card payment-register-card">
              <div className="payers-card-title">
                <div>
                  <h2>6. Registro de pago</h2>
                  <span className="payers-card-sub">Paso 3 de 5 · registra el intento y su resultado.</span>
                </div>
              </div>

              <div className="payment-method-grid">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    className={`payment-method ${selectedMethod === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <MethodIcon name={method.icon} />
                    <span>{method.label}</span>
                    {selectedMethod === method.id && <span className="payment-check"><Icon name="check" size={14} /></span>}
                  </button>
                ))}
              </div>

              <div className="form-field">
                <label htmlFor="amount">Monto a registrar</label>
                <div className="input-with-prefix">
                  <span>S/</span>
                  <input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
                  <Icon name="money" size={19} />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="payment-date">Fecha de pago</label>
                <div className="input-with-icon">
                  <input id="payment-date" type="text" value="17/09/2026" readOnly />
                  <Icon name="calendar" size={19} />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="result">Resultado de la operación</label>
                <select id="result" value={result} onChange={(event) => setResult(event.target.value)}>
                  <option value="confirmado">Confirmado</option>
                  <option value="pendiente">Pendiente de validación</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="reference">Referencia / observación <span>(opcional)</span></label>
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Ej. N° de operación, nombre del titular, etc."
                />
              </div>

              <button className="primary-payment-button" type="button" onClick={registerPayment}>
                <Icon name="lock" size={17} />
                Registrar pago
              </button>

              <p className="secure-note">
                En una implementación real, el medio digital se valida contra el proveedor de pagos. Esta versión académica simula la confirmación.
              </p>

              {notice && <div className="payers-toast" role="status">{notice}</div>}
            </article>

            <article className="payers-card status-card">
              <div className="payers-card-title">
                <h2>7. Estado del cliente y servicio</h2>
                <span className={`status-large ${initialPaid ? 'confirmed' : 'pending'}`}>{paymentStatus}</span>
              </div>

              <div className="status-grid">
                <div><span>Servicio</span><strong>{service.nombre}</strong></div>
                <div><span>Fecha de atención</span><strong>{service.fechaAtencion}</strong></div>
                <div><span>Estado de pago</span><strong>{paymentStatus}</strong></div>
                <div><span>Estado del servicio</span><strong>{serviceStatus}</strong></div>
                <div><span>Saldo pendiente</span><strong>{money(balance)}</strong></div>
              </div>
            </article>

            <article className="payers-card" id="indicadores">
              <div className="payers-card-title">
                <div>
                  <h2>8. Indicadores de PAYERS</h2>
                  <span className="payers-card-sub">Vista rápida para BI.</span>
                </div>
                <a className="text-button" href="#indicadores">Ver reportes</a>
              </div>

              <div className="kpi-grid">
                <div className="kpi-item">
                  <span className="kpi-icon"><Icon name="trend" size={19} /></span>
                  <div><small>Tasa de confirmación</small><strong>{confirmedRate}%</strong></div>
                  <em className="kpi-positive">↑</em>
                </div>
                <div className="kpi-item">
                  <span className="kpi-icon"><Icon name="calendar" size={18} /></span>
                  <div><small>Cumplimiento de pagos</small><strong>{scheduleCompliance}%</strong></div>
                  <em className="kpi-neutral">—</em>
                </div>
                <div className="kpi-item">
                  <span className="kpi-icon"><Icon name="clock" size={19} /></span>
                  <div><small>Pagos pendientes</small><strong>{pendingRate}%</strong></div>
                  <em className="kpi-neutral">—</em>
                </div>
                <div className="kpi-item">
                  <span className="kpi-icon"><Icon name="alert" size={19} /></span>
                  <div><small>Pagos vencidos</small><strong>{overdueRate}%</strong></div>
                  <em className="kpi-positive">↓</em>
                </div>
                <div className="kpi-item">
                  <span className="kpi-icon"><Icon name="card" size={19} /></span>
                  <div><small>Pagos rechazados</small><strong>{rejectedRate}%</strong></div>
                  <em className="kpi-positive">↓</em>
                </div>
                <div className="kpi-item">
                  <span className="kpi-icon"><Icon name="money" size={19} /></span>
                  <div><small>Ticket registrado</small><strong>{history.length ? money(confirmedTotal) : 'S/ 0.00'}</strong></div>
                  <em className="kpi-neutral">•</em>
                </div>
              </div>

              <div className="kpi-legend">
                <span>Los valores se recalculan con la interacción de la demo.</span>
                <span>Menos pagos vencidos/rechazados = menor incidencia.</span>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="payers-footer">
        <span>© 2026 Origen Spa &amp; Bienestar</span>
        <span>Sistema de Gestión · Fase 3: PAYERS</span>
        <span>Relajación · Bienestar · Confianza</span>
      </footer>
    </div>
  )
}
