import { useState } from 'react'

const PREGUNTAS = [
  {
    id: 'objetivo',
    numero: '01',
    titulo: '¿Cuál es la prioridad de tu visita?',
    opciones: [
      { id: 'facial', texto: 'Renovación e higiene cutánea profunda', servicio: 'Limpieza facial profunda con ozono' },
      { id: 'tension', texto: 'Alivio de contracturas y tensión muscular', servicio: 'Masaje descontracturante' },
      { id: 'relax', texto: 'Desconexión integral y reducción de estrés', servicio: 'Masaje con piedras volcánicas' },
      { id: 'hidratacion', texto: 'Hidratación intensiva y nutrición dérmica', servicio: 'Facial hidratante intensivo' },
    ],
  },
  {
    id: 'tiempo',
    numero: '02',
    titulo: '¿De qué disponibilidad horaria dispones?',
    opciones: [
      { id: '45-60', texto: '45 a 60 minutos (Sesión enfocada)' },
      { id: '75', texto: '75 minutos (Sesión extendida de cabina)' },
      { id: '90+', texto: '90 minutos o más (Experiencia completa)' },
    ],
  },
  {
    id: 'estado',
    numero: '03',
    titulo: '¿Qué molestia o condición predomina en este momento?',
    opciones: [
      { id: 'rostro', texto: 'Sensación de tirantez, opacidad o poros congestionados' },
      { id: 'espalda', texto: 'Sobrecarga o dolor punzante en cuello y espalda alta' },
      { id: 'cansancio', texto: 'Fatiga generalizada física y mental' },
    ],
  },
]

const RESULTADOS = {
  facial: {
    nombre: 'Limpieza facial profunda con ozono',
    categoria: 'Cuidado Facial',
    duracion: '60 min',
    precio: 'Desde S/ 95',
    diagnostico: 'Recomendamos iniciar con una higiene técnica profunda para desobstruir poros, oxigenar el tejido y preparar la piel antes de cualquier nutrición intensiva.',
  },
  tension: {
    nombre: 'Masaje descontracturante',
    categoria: 'Terapia Muscular',
    duracion: '60 u 90 min',
    precio: 'Desde S/ 90',
    diagnostico: 'Tu cuadro sugiere tensión miofascial localizada. El protocolo de presión profunda y puntos gatillo ayudará a distender la musculatura paravertebral y cervical.',
  },
  relax: {
    nombre: 'Masaje con piedras volcánicas',
    categoria: 'Sedación & Termoterapia',
    duracion: '75 min',
    precio: 'Desde S/ 110',
    diagnostico: 'La termoterapia de basalto caliente actúa directamente sobre el sistema nervioso periférico, reduciendo los niveles de cortisol y restaurando el equilibrio físico.',
  },
  hidratacion: {
    nombre: 'Facial hidratante intensivo',
    categoria: 'Hidronutrición',
    duracion: '60 min',
    precio: 'Desde S/ 80',
    diagnostico: 'La barrera dérmica requiere reposición hídrica inmediata. Este tratamiento restablece los factores naturales de hidratación y calma la reactividad.',
  },
}

export default function SpaQuizWidget({ onSelectTreatment }) {
  const [paso, setPaso] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)

  function seleccionar(opcion) {
    const actualizada = { ...respuestas, [PREGUNTAS[paso].id]: opcion }
    setRespuestas(actualizada)

    if (paso < PREGUNTAS.length - 1) {
      setPaso(paso + 1)
    } else {
      const objetivo = actualizada.objetivo?.id || 'facial'
      setResultado(RESULTADOS[objetivo] || RESULTADOS.facial)
    }
  }

  function reiniciar() {
    setPaso(0)
    setRespuestas({})
    setResultado(null)
  }

  function aplicar() {
    if (resultado && onSelectTreatment) {
      onSelectTreatment(resultado.nombre)
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-alt, #1F3026)',
        border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
        borderRadius: '4px',
        padding: 'clamp(2rem, 5vw, 3rem)',
        color: 'var(--color-ink, #F3EEE2)',
        maxWidth: '860px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            color: 'var(--color-accent, #C89B5C)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          Orientación Personalizada
        </span>
        <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', margin: '0 0 0.5rem 0' }}>
          ¿Qué tratamiento requiere tu piel o bienestar?
        </h3>
        <p style={{ color: 'var(--color-ink-muted, #B9C4B7)', fontSize: '0.92rem', margin: '0 auto' }}>
          Responde 3 consultas técnicas breves para calcular la recomendación óptima antes de tu cita presencial.
        </p>
      </div>

      {!resultado ? (
        <div>
          {/* Indicador de progreso */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '2rem',
              fontSize: '0.8rem',
              color: 'var(--color-ink-muted, #B9C4B7)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {PREGUNTAS.map((p, i) => (
              <span
                key={p.id}
                style={{
                  color: i === paso ? 'var(--color-accent, #C89B5C)' : i < paso ? 'var(--color-ink, #F3EEE2)' : 'var(--color-ink-muted, #B9C4B7)',
                  fontWeight: i === paso ? 600 : 400,
                }}
              >
                Paso {p.numero} {i < PREGUNTAS.length - 1 ? '—' : ''}
              </span>
            ))}
          </div>

          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 500,
              textAlign: 'center',
              marginBottom: '1.5rem',
              color: 'var(--color-ink, #F3EEE2)',
            }}
          >
            {PREGUNTAS[paso].titulo}
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            {PREGUNTAS[paso].opciones.map((op, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => seleccionar(op)}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '3px',
                  background: 'var(--color-bg, #16231C)',
                  border: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
                  color: 'var(--color-ink, #F3EEE2)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent, #C89B5C)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-line, rgba(243, 238, 226, 0.16))'
                }}
              >
                <span style={{ color: 'var(--color-accent, #C89B5C)', marginRight: '8px', fontSize: '0.8rem' }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{op.texto}</span>
              </button>
            ))}
          </div>

          {paso > 0 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-ink-muted, #B9C4B7)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'var(--font-body)',
                }}
              >
                ← Volver a la consulta anterior
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Resultado Sobrio */
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            background: 'var(--color-bg, #16231C)',
            border: '1px solid var(--color-line, rgba(243, 238, 226, 0.2))',
            borderRadius: '4px',
            padding: '2rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--color-accent, #C89B5C)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
              display: 'block',
              marginBottom: '0.4rem',
            }}
          >
            Protocolo Sugerido · {resultado.categoria}
          </span>

          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: 'var(--color-ink, #F3EEE2)',
              margin: '0 0 0.8rem 0',
            }}
          >
            {resultado.nombre}
          </h4>

          <p style={{ color: 'var(--color-ink-muted, #B9C4B7)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {resultado.diagnostico}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '2rem',
              padding: '0.9rem 0',
              borderTop: '1px solid var(--color-line, rgba(243, 238, 226, 0.12))',
              borderBottom: '1px solid var(--color-line, rgba(243, 238, 226, 0.12))',
              marginBottom: '1.8rem',
              fontSize: '0.88rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-ink-muted, #B9C4B7)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                Duración de cabina
              </span>
              <strong style={{ color: 'var(--color-ink, #F3EEE2)' }}>{resultado.duracion}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-muted, #B9C4B7)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                Inversión estimada
              </span>
              <strong style={{ color: 'var(--color-clay, #D9AFA0)' }}>{resultado.precio}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={aplicar}
              className="btn-primary"
            >
              Solicitar diagnóstico con este tratamiento
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="btn-ghost"
              style={{ fontSize: '0.88rem', padding: '0.8rem 1.2rem' }}
            >
              Reiniciar consulta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
