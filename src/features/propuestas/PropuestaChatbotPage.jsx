import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../shared/components/Navbar'
import Footer from '../../shared/components/Footer'
import { validarTokenPropuesta } from '../../lib/mistralService'
import { obtenerPropuestaPorToken, enviarMensajeChatbot, confirmarPropuestaFinal } from './api/propuestasApi'
import { logger } from '../../lib/logger'

export default function PropuestaChatbotPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  // Datos de la propuesta
  const [propuesta, setPropuesta] = useState(null)
  const [propuestaActual, setPropuestaActual] = useState(null)
  const [nombreCliente, setNombreCliente] = useState('')
  
  // Chat
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmarVisible, setConfirmarVisible] = useState(false)
  const [confirming, setConfirming] = useState(false)
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    async function cargarPropuesta() {
      try {
        // Validar formato del token
        if (!validarTokenPropuesta(token)) {
          setError('El enlace no es válido. Por favor solicita un nuevo enlace.')
          setLoading(false)
          return
        }

        // Obtener datos de la propuesta
        const data = await obtenerPropuestaPorToken(token)

        if (!data) {
          setError('No se encontró la propuesta solicitada. Contacta al staff.')
          setLoading(false)
          return
        }

        setPropuesta(data)
        setPropuestaActual(data.propuesta_actual)
        setNombreCliente(data.contacto?.nombre || 'Cliente')
        
        // Cargar historial de conversación si existe
        if (data.historial_conversacion && data.historial_conversacion.length > 0) {
          setMessages(data.historial_conversacion)
        } else {
          // Mensaje inicial del asistente
          setMessages([{
            rol: 'assistant',
            mensaje: `¡Hola ${data.contacto?.nombre || 'Cliente'}! Soy tu asistente de Origen Spa. Veo que tienes una propuesta para ${data.propuesta_actual?.servicio || 'nuestros servicios'}. ¿Te gustaría negociar algún aspecto de la propuesta?`,
            timestamp: new Date().toISOString()
          }])
        }

        setLoading(false)
        logger.info('propuestaChatbot', 'Propuesta cargada exitosamente', { idPropuesta: data.id_propuesta })
      } catch (error) {
        logger.error('propuestaChatbot', 'Error cargando propuesta', { error })
        setError(error.message || 'Error al cargar la propuesta')
        setLoading(false)
      }
    }

    cargarPropuesta()
  }, [token])

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!inputMessage.trim() || sending) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    try {
      // Agregar mensaje del usuario
      const newUserMessage = {
        rol: 'user',
        mensaje: userMessage,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, newUserMessage])

      // Enviar al chatbot
      const response = await enviarMensajeChatbot(
        propuesta.id_propuesta,
        userMessage,
        messages,
        propuestaActual
      )

      if (response.success) {
        // Agregar respuesta del asistente
        const assistantMessage = {
          rol: 'assistant',
          mensaje: response.data.message,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Actualizar propuesta si hubo cambios
        if (response.data.updatedProposal) {
          setPropuestaActual(response.data.updatedProposal)
        }

        // Mostrar botón de confirmación si el asistente indica
        if (response.data.confirmar) {
          setConfirmarVisible(true)
        }
      } else {
        throw new Error(response.error?.message || 'Error en chatbot')
      }
    } catch (error) {
      logger.error('propuestaChatbot', 'Error enviando mensaje', { error })
      setMessages(prev => [...prev, {
        rol: 'assistant',
        mensaje: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setSending(false)
    }
  }

  async function handleConfirmarPropuesta() {
    setConfirming(true)
    try {
      const response = await confirmarPropuestaFinal(
        propuesta.id_propuesta,
        propuesta.id_contacto,
        propuestaActual
      )

      if (response.success) {
        setSuccess(true)
        logger.info('propuestaChatbot', 'Propuesta confirmada exitosamente')
      } else {
        throw new Error(response.error?.message || 'Error al confirmar propuesta')
      }
    } catch (error) {
      logger.error('propuestaChatbot', 'Error confirmando propuesta', { error })
      alert('Error al confirmar propuesta: ' + error.message)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="section" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}>
              <span className="spinner"></span>
            </div>
            <p style={{ color: 'var(--color-ink-muted)' }}>Cargando tu propuesta...</p>
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
              }}>¡Propuesta Confirmada!</h2>
              <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>
                Gracias {nombreCliente}. Tu propuesta ha sido confirmada y está siendo procesada.
                Te contactaremos pronto para coordinar los detalles finales.
              </p>
              <div style={{ 
                background: 'rgba(200, 155, 92, 0.1)', 
                padding: '1.5rem', 
                borderRadius: '6px',
                border: '1px solid rgba(200, 155, 92, 0.3)',
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <h4 style={{ 
                  fontFamily: 'var(--font-display)',
                  marginBottom: '1rem',
                  color: 'var(--color-accent)'
                }}>Resumen de tu propuesta:</h4>
                {propuestaActual && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
                    <p><strong>Servicio:</strong> {propuestaActual.servicio || 'No especificado'}</p>
                    <p><strong>Precio:</strong> S/ {propuestaActual.precio || '0'}</p>
                    <p><strong>Duración:</strong> {propuestaActual.duracion || 'No especificado'}</p>
                    {propuestaActual.descuento && <p><strong>Descuento:</strong> {propuestaActual.descuento}</p>}
                  </div>
                )}
              </div>
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
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
                Tu Propuesta Personalizada
              </h1>
              <p style={{ 
                color: 'var(--color-ink-muted)', 
                fontSize: '1.1rem',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Negocia con nuestro asistente IA para ajustar tu propuesta a tus necesidades
              </p>
            </div>

            {/* Layout de dos paneles */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Panel Izquierdo: Propuesta Visual */}
              <div style={{
                background: 'var(--color-bg-alt)',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid var(--color-line)'
              }}>
                <h3 style={{ 
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  marginBottom: '1.5rem',
                  color: 'var(--color-accent)'
                }}>
                  Propuesta Actual
                </h3>
                
                {propuestaActual && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--color-ink-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        Servicio
                      </label>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        color: 'var(--color-ink)'
                      }}>
                        {propuestaActual.servicio || 'No especificado'}
                      </div>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--color-ink-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        Precio
                      </label>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: '700',
                        color: 'var(--color-accent)'
                      }}>
                        S/ {propuestaActual.precio || '0'}
                      </div>
                      {propuestaActual.descuento && (
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#b7d2b9',
                          marginTop: '0.5rem'
                        }}>
                          {propuestaActual.descuento} de descuento aplicado
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--color-ink-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        Duración
                      </label>
                      <div style={{ fontSize: '1rem', color: 'var(--color-ink)' }}>
                        {propuestaActual.duracion || 'No especificado'}
                      </div>
                    </div>

                    {propuestaActual.fecha && (
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontSize: '0.8rem', 
                          color: 'var(--color-ink-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}>
                          Fecha Sugerida
                        </label>
                        <div style={{ fontSize: '1rem', color: 'var(--color-ink)' }}>
                          {propuestaActual.fecha}
                        </div>
                      </div>
                    )}

                    {propuestaActual.incluye && (
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontSize: '0.8rem', 
                          color: 'var(--color-ink-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}>
                          Incluye
                        </label>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-ink)' }}>
                          {propuestaActual.incluye}
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(183, 210, 185, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(183, 210, 185, 0.3)',
                      fontSize: '0.85rem',
                      color: 'var(--color-ink-muted)'
                    }}>
                      <strong>💡 Tip:</strong> Usa el chat para negociar precio, fechas o cualquier aspecto de esta propuesta.
                    </div>
                  </div>
                )}
              </div>

              {/* Panel Derecho: Chatbot */}
              <div style={{
                background: 'var(--color-bg-alt)',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid var(--color-line)',
                display: 'flex',
                flexDirection: 'column',
                height: '600px'
              }}>
                <h3 style={{ 
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  marginBottom: '1rem',
                  color: 'var(--color-accent)'
                }}>
                  Asistente Virtual
                </h3>

                {/* Área de mensajes */}
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'rgba(15, 30, 23, 0.3)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}>
                  {messages.map((msg, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: msg.rol === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        background: msg.rol === 'user' 
                          ? 'var(--color-accent)' 
                          : 'rgba(200, 155, 92, 0.2)',
                        color: msg.rol === 'user' 
                          ? 'var(--color-ink-on-contrast)' 
                          : 'var(--color-ink)',
                        fontSize: '0.9rem',
                        lineHeight: '1.4'
                      }}>
                        {msg.mensaje}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={sending}
                    style={{
                      flex: 1,
                      padding: '0.8rem',
                      background: 'rgba(15, 30, 23, 0.5)',
                      border: '1px solid var(--color-line)',
                      borderRadius: '4px',
                      color: 'var(--color-ink)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    style={{
                      padding: '0.8rem 1.5rem',
                      background: sending ? 'var(--color-ink-muted)' : 'var(--color-accent)',
                      color: 'var(--color-ink-on-contrast)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: sending ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    {sending ? '...' : 'Enviar'}
                  </button>
                </form>

                {/* Botón de confirmación */}
                {confirmarVisible && (
                  <button
                    onClick={handleConfirmarPropuesta}
                    disabled={confirming}
                    style={{
                      marginTop: '1rem',
                      width: '100%',
                      padding: '1rem',
                      background: confirming ? 'var(--color-ink-muted)' : '#b7d2b9',
                      color: '#1B2A21',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: confirming ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    {confirming ? 'Confirmando...' : '✅ Confirmar Propuesta'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}