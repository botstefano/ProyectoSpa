import { useState } from 'react'

const QUIZ_QUESTIONS = [
  {
    id: 'goal',
    title: '1. ¿Cuál es tu objetivo principal el día de hoy?',
    options: [
      { id: 'facial', label: 'Cuidar mi rostro y renovar mi piel', icon: '✨', service: 'Limpieza facial profunda' },
      { id: 'stress', label: 'Aliviar tensión muscular y estrés', icon: '💆', service: 'Masaje descontracturante' },
      { id: 'detox', label: 'Desintoxicar y relajar todo el cuerpo', icon: '🌿', service: 'Ritual corporal relajante' },
      { id: 'glow', label: 'Hidratación intensiva y luminosidad', icon: '💧', service: 'Facial hidratante' },
    ],
  },
  {
    id: 'time',
    title: '2. ¿De cuánto tiempo dispones para tu sesión?',
    options: [
      { id: 'quick', label: '45 a 60 minutos (Sesión enfocada)', icon: '⏱️' },
      { id: 'full', label: '75 a 90 minutos (Experiencia completa)', icon: '⏳' },
      { id: 'luxury', label: 'Más de 90 minutos (Ritual de desconexión total)', icon: '🕯️' },
    ],
  },
  {
    id: 'concern',
    title: '3. ¿Qué sensación predomina en ti en este momento?',
    options: [
      { id: 'tired_face', label: 'Piel opaca, poros obstruidos o sequedad', icon: '🧖‍♀️', service: 'Facial hidratante' },
      { id: 'neck_pain', label: 'Dolor o nudos en cuello, espalda y hombros', icon: '⚡', service: 'Masaje descontracturante' },
      { id: 'mental_fatigue', label: 'Cansancio mental, necesito desconectar', icon: '🧘', service: 'Masaje relajante con aromaterapia' },
    ],
  },
]

const RECOMMENDATIONS = {
  facial: {
    name: 'Facial Hidratante & Limpieza Profunda',
    category: 'Cuidado Facial',
    duration: '60 min',
    price: 'S/ 80.00',
    why: 'Tu piel necesita oxigenación y balance hidrolipídico para recuperar luminosidad natural.',
    included: ['Vapor de ozono', 'Exfoliación enzimática', 'Mascarilla de colágeno', 'Masaje facial estimulante'],
  },
  stress: {
    name: 'Masaje Descontracturante Profundo',
    category: 'Terapia Muscular',
    duration: '60 o 90 min',
    price: 'S/ 90.00',
    why: 'Ideal para disolver contracturas acumuladas por postura y estrés en cervicales y espalda.',
    included: ['Aceites esenciales de romero y lavanda', 'Técnica miofascial', 'Puntos gatillo', 'Toallas térmicas'],
  },
  detox: {
    name: 'Ritual Corporal Relajante & Envoltura',
    category: 'Bienestar Holístico',
    duration: '75 min',
    price: 'S/ 140.00',
    why: 'Exfolia células muertas, activa el drenaje linfático y aporta nutrición profunda.',
    included: ['Sales minerales del mar', 'Envoltura hidratante', 'Ducha de sensaciones', 'Masaje final'],
  },
  default: {
    name: 'Diagnóstico Integral y Facial Personalizado',
    category: 'Primer Contacto',
    duration: '45 min',
    price: 'Gratis (Diagnóstico)',
    why: 'Analizaremos tu biotipo cutáneo para definir el protocolo idóneo sin costo en tu primera visita.',
    included: ['Lámpara de Wood', 'Evaluación de elasticidad', 'Guía de cuidados para casa', 'Asesoría 1 a 1'],
  },
}

export default function SpaQuizWidget({ onSelectTreatment }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  function handleOptionSelect(questionId, option) {
    const updated = { ...answers, [questionId]: option }
    setAnswers(updated)

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      // Calcular recomendación
      const goalChoice = updated.goal?.id
      const rec = RECOMMENDATIONS[goalChoice] || RECOMMENDATIONS.default
      setResult(rec)
    }
  }

  function handleReset() {
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  function handleApplyResult() {
    if (result && onSelectTreatment) {
      onSelectTreatment(result.name)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1b3a2b 0%, #0e2017 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(82, 183, 136, 0.35)',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
        color: '#edf2f4',
        margin: '2rem 0',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(82, 183, 136, 0.2)',
            border: '1px solid #52b788',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#b7d2b9',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.6rem',
          }}
        >
          Diagnóstico Exprés Interactivo
        </span>
        <h3 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', margin: '0 0 0.5rem 0', color: '#ffffff' }}>
          ¿Qué tratamiento necesita tu cuerpo hoy?
        </h3>
        <p style={{ margin: 0, color: '#b7d2b9', fontSize: '0.95rem', maxWidth: '500px', marginInline: 'auto' }}>
          Responde 3 preguntas rápidas y el sistema calculará tu experiencia ideal con recomendación de protocolo.
        </p>
      </div>

      {!result ? (
        <div>
          {/* Progress bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '1.8rem',
            }}
          >
            {QUIZ_QUESTIONS.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === step ? '40px' : '18px',
                  height: '6px',
                  borderRadius: '3px',
                  background: idx <= step ? '#52b788' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          <h4 style={{ fontSize: '1.15rem', color: '#f8f9fa', textAlign: 'center', marginBottom: '1.2rem' }}>
            {QUIZ_QUESTIONS[step].title}
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            {QUIZ_QUESTIONS[step].options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionSelect(QUIZ_QUESTIONS[step].id, option)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '1.1rem 1.2rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(82, 183, 136, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(82, 183, 136, 0.18)'
                  e.currentTarget.style.borderColor = '#52b788'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.25)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {step > 0 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#95d5b2',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Pregunta anterior
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Resultado */
        <div
          style={{
            maxWidth: '650px',
            margin: '0 auto',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #52b788',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>🌿</span>
          <div style={{ color: '#74c69d', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px' }}>
            {result.category} · Recomendación Personalizada
          </div>
          <h4 style={{ fontSize: '1.5rem', color: '#ffffff', margin: '0.4rem 0 0.8rem 0' }}>
            {result.name}
          </h4>
          <p style={{ color: '#d8f3dc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
            {result.why}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '1.5rem',
            }}
          >
            {result.included.map((item, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(82, 183, 136, 0.15)',
                  border: '1px solid rgba(82, 183, 136, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: '#b7d2b9',
                }}
              >
                ✓ {item}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#95d5b2' }}>DURACIÓN</span>
              <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{result.duration}</strong>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.15)' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#95d5b2' }}>PRECIO ESTIMADO</span>
              <strong style={{ fontSize: '1.1rem', color: '#52b788' }}>{result.price}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleApplyResult}
              style={{
                padding: '0.85rem 1.6rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                borderTop: '1px solid #52b788',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(45, 106, 79, 0.5)',
              }}
            >
              🎯 Solicitar diagnóstico con este tratamiento ➔
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.85rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: '#d8f3dc',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🔄 Repetir test
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
