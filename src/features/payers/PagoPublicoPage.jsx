import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerPagoPorToken, completarPagoSimulado, obtenerComprobantePago } from './api/pagoSimuladoApi'
import { descargarComprobantePDF, generarNombreComprobante } from '../../lib/pdfService'
import { logger } from '../../lib/logger'

const PAYMENT_METHODS = [
  { id: 'yape-plin', label: 'Yape / Plin', icon: '📱', description: 'Escanea el QR o realiza la transferencia' },
  { id: 'transferencia', label: 'Transferencia bancaria', icon: '🏦', description: 'Transferencia a cuenta bancaria' },
  { id: 'efectivo', label: 'Efectivo', icon: '💵', description: 'Paga en persona en nuestras instalaciones' },
  { id: 'tarjeta', label: 'Tarjeta', icon: '💳', description: 'Tarjeta de crédito o débito' },
]

function formatCurrency(amount) {
  return `S/ ${amount.toFixed(2)}`
}

export default function PagoPublicoPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagoData, setPagoData] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('yape-plin')
  const [formData, setFormData] = useState({})
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [comprobante, setComprobante] = useState(null)

  useEffect(() => {
    async function loadPagoData() {
      try {
        setLoading(true)
        logger.info('PagoPublico', 'Cargando datos de pago', { token })
        
        const data = await obtenerPagoPorToken(token)
        setPagoData(data)
        logger.info('PagoPublico', 'Datos de pago cargados', { 
          idContacto: data.id_contacto,
          monto: data.monto_total 
        })
      } catch (err) {
        logger.error('PagoPublico', 'Error cargando pago', { error: err.message })
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadPagoData()
    }
  }, [token])

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmitPayment(e) {
    e.preventDefault()
    
    if (!selectedMethod) {
      alert('Por favor selecciona un método de pago')
      return
    }

    // Validaciones según método
    if (selectedMethod === 'yape-plin' && !formData.celular) {
      alert('Por favor ingresa tu número de celular')
      return
    }

    if (selectedMethod === 'transferencia' && !formData.operacion) {
      alert('Por favor ingresa el número de operación')
      return
    }

    if (selectedMethod === 'tarjeta' && (!formData.numero || !formData.vencimiento || !formData.cvv)) {
      alert('Por favor completa todos los datos de la tarjeta')
      return
    }

    try {
      setProcessing(true)
      logger.info('PagoPublico', 'Iniciando proceso de pago', { 
        token, 
        metodo: selectedMethod 
      })

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000))

      const datosPago = {
        metodo_pago: selectedMethod,
        ...formData,
        fecha_procesamiento: new Date().toISOString()
      }

      const result = await completarPagoSimulado(token, datosPago)

      if (result.success) {
        logger.info('PagoPublico', 'Pago completado exitosamente', { 
          token, 
          numeroComprobante: result.data.numeroComprobante 
        })
        
        setCompleted(true)
        
        // Obtener comprobante
        const comprobanteData = await obtenerComprobantePago(token)
        setComprobante(comprobanteData)
      } else {
        throw new Error(result.error?.message || 'Error al procesar el pago')
      }
    } catch (err) {
      logger.error('PagoPublico', 'Error procesando pago', { error: err.message })
      alert(`Error al procesar el pago: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  function downloadComprobante() {
    if (!comprobante) return

    const nombreArchivo = generarNombreComprobante(comprobante)
    descargarComprobantePDF(comprobante, nombreArchivo)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #16231C 0%, #1F3026 100%)',
        color: '#F3EEE2'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
          <h2>Cargando información de pago...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #16231C 0%, #1F3026 100%)',
        color: '#F3EEE2',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          background: 'rgba(255,255,255,0.1)', 
          padding: '30px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#ff6b6b' }}>Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: '#C89B5C',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '20px'
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #16231C 0%, #1F3026 100%)',
        color: '#F3EEE2',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          background: 'rgba(255,255,255,0.05)', 
          padding: '40px', 
          borderRadius: '8px',
          marginTop: '40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ color: '#4CAF50', marginBottom: '10px' }}>¡Pago Completado!</h1>
            <p style={{ opacity: 0.8 }}>
              Tu pago ha sido procesado exitosamente
            </p>
          </div>

          {comprobante && (
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>Comprobante de Pago</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <p><strong>N° Comprobante:</strong> {comprobante.numero_comprobante}</p>
                <p><strong>Tipo:</strong> {comprobante.tipo_comprobante.toUpperCase()}</p>
                <p><strong>Fecha:</strong> {new Date(comprobante.fecha_completado).toLocaleString('es-ES')}</p>
                <p><strong>Cliente:</strong> {comprobante.contacto.nombre}</p>
                <p><strong>Servicio:</strong> {comprobante.servicio_contratado}</p>
                <p><strong>Monto:</strong> {formatCurrency(comprobante.monto_total)}</p>
                <p><strong>Método:</strong> {comprobante.metodo_pago_elegido}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={downloadComprobante}
              style={{
                background: '#C89B5C',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              📄 Descargar Comprobante
            </button>
            <button 
              onClick={() => navigate('/')}
              style={{
                background: 'transparent',
                color: '#F3EEE2',
                border: '1px solid #F3EEE2',
                padding: '14px 28px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Volver al inicio
            </button>
          </div>

          <p style={{ 
            textAlign: 'center', 
            marginTop: '30px', 
            fontSize: '14px', 
            opacity: 0.7 
          }}>
            Hemos enviado una confirmación a tu email. 
            ¡Gracias por confiar en Origen Spa & Bienestar!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #16231C 0%, #1F3026 100%)',
      color: '#F3EEE2',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Origen Spa & Bienestar</h1>
          <p style={{ opacity: 0.8 }}>Completa tu pago de forma segura</p>
        </div>

        {/* Detalles del pago */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '25px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Resumen del Pago</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Servicio:</span>
            <strong>{pagoData?.servicio_contratado}</strong>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#C89B5C',
            paddingTop: '15px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span>Total a pagar:</span>
            <span>{formatCurrency(pagoData?.monto_total || 0)}</span>
          </div>
        </div>

        {/* Selección de método de pago */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>Selecciona método de pago</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                style={{
                  background: selectedMethod === method.id 
                    ? 'rgba(200, 155, 92, 0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  border: selectedMethod === method.id 
                    ? '2px solid #C89B5C' 
                    : '1px solid rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>{method.icon}</span>
                <div>
                  <div style={{ fontWeight: '600' }}>{method.label}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>{method.description}</div>
                </div>
                {selectedMethod === method.id && (
                  <span style={{ marginLeft: 'auto', color: '#C89B5C' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario según método */}
        <form onSubmit={handleSubmitPayment}>
          {selectedMethod === 'yape-plin' && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>💳 Yape / Plin</h3>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '4px',
                textAlign: 'center',
                marginBottom: '15px',
                color: '#16231C'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📱</div>
                <p style={{ marginBottom: '10px' }}>Escanea el QR con Yape/Plin</p>
                <div style={{ 
                  background: '#f0f0f0', 
                  padding: '15px', 
                  borderRadius: '4px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  QR SIMULADO
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Tu número de celular:
                </label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular || ''}
                  onChange={handleInputChange}
                  placeholder="999 999 999"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#F3EEE2',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
            </div>
          )}

          {selectedMethod === 'transferencia' && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>🏦 Transferencia Bancaria</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '15px' }}>
                <p><strong>Banco:</strong> BCP / Interbank</p>
                <p><strong>Cuenta:</strong> 123-4567890-0-12</p>
                <p><strong>CCI:</strong> 12345678901234567890</p>
                <p><strong>A nombre de:</strong> Origen Spa & Bienestar</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Número de operación:
                </label>
                <input
                  type="text"
                  name="operacion"
                  value={formData.operacion || ''}
                  onChange={handleInputChange}
                  placeholder="Ej: 123456789"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#F3EEE2',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
            </div>
          )}

          {selectedMethod === 'efectivo' && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>💵 Pago en Efectivo</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '15px' }}>
                <p><strong>Dirección:</strong> Av. Principal 123, Trujillo</p>
                <p><strong>Horarios:</strong> Lun-Sáb 9:00 - 20:00</p>
                <p><strong>Referencia:</strong> Frente al parque central</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Nombre de quien pagará:
                </label>
                <input
                  type="text"
                  name="nombre_pagador"
                  value={formData.nombre_pagador || ''}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#F3EEE2',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
            </div>
          )}

          {selectedMethod === 'tarjeta' && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>💳 Tarjeta de Crédito/Débito</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                    Número de tarjeta:
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero || ''}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#F3EEE2',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      Vencimiento:
                    </label>
                    <input
                      type="text"
                      name="vencimiento"
                      value={formData.vencimiento || ''}
                      onChange={handleInputChange}
                      placeholder="MM/AA"
                      maxLength="5"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#F3EEE2',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      CVV:
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv || ''}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength="4"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#F3EEE2',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={processing}
            style={{
              width: '100%',
              background: processing ? '#666' : '#C89B5C',
              color: 'white',
              border: 'none',
              padding: '16px',
              borderRadius: '4px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              marginTop: '20px',
              opacity: processing ? 0.7 : 1
            }}
          >
            {processing ? '⏳ Procesando pago...' : `Pagar ${formatCurrency(pagoData?.monto_total || 0)}`}
          </button>
        </form>

        {/* Información de seguridad */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px', 
          fontSize: '12px', 
          opacity: 0.6 
        }}>
          🔒 Pago seguro procesado por Origen Spa & Bienestar<br/>
          Este enlace expira en 7 días
        </div>
      </div>
    </div>
  )
}