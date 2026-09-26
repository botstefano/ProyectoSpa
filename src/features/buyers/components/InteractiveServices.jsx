import { useState } from 'react'

const CATEGORIAS = ['Todos', 'Faciales', 'Masajes', 'Corporales', 'Diagnóstico']

const TRATAMIENTOS = [
  {
    id: 'facial-hidratante',
    categoria: 'Faciales',
    nombre: 'Facial hidratante intensivo',
    desc: 'Limpieza profunda, exfoliación suave e hidratación biocompatible con ácido hialurónico según tu tipo de piel.',
    duracion: '60 min',
    precio: 'Desde S/ 80',
    detalles: 'Restablece la barrera hidrolipídica cutánea, atenúa líneas de deshidratación y aporta luminosidad natural.',
    protocolo: [
      'Doble higiene facial con emulsión botánica',
      'Exfoliación suave con microesferas de jojoba',
      'Vaporización tibia y tonificación con hidrolatos',
      'Mascarilla hidroplástica selladora de alta nutrición',
      'Masaje facial de estimulación circulatoria y fotoprotección',
    ],
  },
  {
    id: 'limpieza-profunda',
    categoria: 'Faciales',
    nombre: 'Limpieza facial profunda con ozono',
    desc: 'Higiene cutánea integral con vapor de ozono y alta frecuencia desinfectante. Ideal para pieles asfícticas.',
    duracion: '60 min',
    precio: 'Desde S/ 95',
    detalles: 'Eliminación controlada de comedones e impurezas sin dañar el tejido, con acción descongestiva inmediata.',
    protocolo: [
      'Desmaquillado y peeling ultrasónico desincrustante',
      'Vapor de ozono para dilatación de poros',
      'Extracción suave no invasiva',
      'Alta frecuencia bactericida y calmante',
      'Velo de colágeno descongestivo y sellado dérmico',
    ],
  },
  {
    id: 'masaje-descontracturante',
    categoria: 'Masajes',
    nombre: 'Masaje descontracturante',
    desc: 'Terapia manual enfocada en liberar tensión acumulada en espalda, cuello, trapecios y hombros.',
    duracion: '60 u 90 min',
    precio: 'Desde S/ 90',
    detalles: 'Disuelve nudos miofasciales, alivia la sobrecarga postural y mejora la irrigación sanguínea en zonas críticas.',
    protocolo: [
      'Evaluación postural preliminar',
      'Termoterapia con compresas herbales calientes',
      'Técnica miofascial sobre puntos gatillo',
      'Estiramientos asistidos de cadenas musculares',
      'Aplicación de bálsamo botánico antiinflamatorio',
    ],
  },
  {
    id: 'masaje-piedras',
    categoria: 'Masajes',
    nombre: 'Masaje con piedras volcánicas',
    desc: 'Combinación armónica de masaje sueco con termoterapia de piedras de basalto caliente para sedación muscular.',
    duracion: '75 min',
    precio: 'Desde S/ 110',
    detalles: 'Efecto sedante natural sobre el sistema nervioso central, aliviando estados de fatiga crónica e insomnio.',
    protocolo: [
      'Inhalación de aromaterapia de lavanda y bergamota',
      'Deslizamiento de piedras calientes sobre meridianos energéticos',
      'Maniobras fluidas y envolventes de cuerpo completo',
      'Bruma calmante de azahar y reposo tibio',
    ],
  },
  {
    id: 'ritual-corporal',
    categoria: 'Corporales',
    nombre: 'Ritual corporal relajante y envoltura',
    desc: 'Exfoliación epidérmica con sales minerales + envoltura nutritiva + masaje para desconexión integral.',
    duracion: '75 min',
    precio: 'Desde S/ 140',
    detalles: 'Elimina células queratinizadas, activa el drenaje linfático y satura la dermis de oligoelementos esenciales.',
    protocolo: [
      'Exfoliación con sales marinas y aceites prensados en frío',
      'Retiro con toallas calientes perfumadas',
      'Envoltura térmica détox o hidro-nutritiva',
      'Masaje final de hidratación y absorción profunda',
    ],
  },
  {
    id: 'diagnostico-facial',
    categoria: 'Diagnóstico',
    nombre: 'Diagnóstico de piel y biotipo cutáneo',
    desc: 'Evaluación técnica con especialista y diseño de plan personalizado. Es tu primer paso en Origen Spa.',
    duracion: '45 min',
    precio: 'Gratis',
    detalles: 'Inspección profesional de hidratación, reactividad y seborregulación para recomendar únicamente lo que tu piel requiere.',
    protocolo: [
      'Análisis dérmico bajo luz polarizada',
      'Determinación de biotipo y estado cutáneo actual',
      'Diseño de propuesta formal bajo metodología IMPULSE',
      'Entrega de guía de recomendaciones domiciliarias',
    ],
  },
]

export default function InteractiveServices({ onSelectTreatment }) {
  const [categoria, setCategoria] = useState('Todos')
  const [expandidoId, setExpandidoId] = useState(null)

  const items = categoria === 'Todos'
    ? TRATAMIENTOS
    : TRATAMIENTOS.filter((t) => t.categoria === categoria)

  function toggleExpand(id) {
    setExpandidoId((prev) => (prev === id ? null : id))
  }

  function handleSelect(nombre) {
    if (onSelectTreatment) {
      onSelectTreatment(nombre)
    }
  }

  return (
    <section className="section section-line" id="servicios">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'var(--color-accent, #C89B5C)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.4rem',
              }}
            >
              Protocolos de Cabina
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.3rem)' }}>Tratamientos</h2>
          </div>

          {/* Filtros Editoriales Discretos */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {CATEGORIAS.map((cat) => {
              const active = categoria === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  style={{
                    background: active ? 'var(--color-bg-alt, #1F3026)' : 'transparent',
                    border: active ? '1px solid var(--color-accent, #C89B5C)' : '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
                    color: active ? 'var(--color-ink, #F3EEE2)' : 'var(--color-ink-muted, #B9C4B7)',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '2px',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista Editorial Interactiva */}
        <div className="services-list">
          {items.map((t) => {
            const isExpanded = expandidoId === t.id
            return (
              <div
                key={t.id}
                style={{
                  borderBottom: '1px solid var(--color-line, rgba(243, 238, 226, 0.16))',
                  transition: 'background 0.2s',
                  background: isExpanded ? 'rgba(31, 48, 38, 0.4)' : 'transparent',
                }}
              >
                <div
                  className="service-row"
                  style={{
                    borderBottom: 'none',
                    padding: '1.5rem 0',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpand(t.id)}
                >
                  <div>
                    <span className="service-name" style={{ display: 'block' }}>
                      {t.nombre}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-ink-muted, #B9C4B7)',
                        marginTop: '3px',
                        display: 'inline-block',
                      }}
                    >
                      {t.duracion} · {t.categoria}
                    </span>
                  </div>

                  <span className="service-desc">{t.desc}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', justifyContent: 'flex-end' }}>
                    <span className="service-price">{t.precio}</span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(t.nombre)
                      }}
                      className="btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.82rem',
                        borderRadius: '2px',
                      }}
                    >
                      Elegir
                    </button>

                    <button
                      type="button"
                      aria-label="Ver detalles"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-ink-muted, #B9C4B7)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Despliegue de protocolo clínico detallado */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 0 1.6rem 0',
                      borderTop: '1px dashed var(--color-line, rgba(243, 238, 226, 0.12))',
                      marginTop: '0.5rem',
                      paddingTop: '1.2rem',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.8fr',
                      gap: '2rem',
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: 'var(--color-accent, #C89B5C)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Propósito clínico
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted, #B9C4B7)', lineHeight: 1.6 }}>
                        {t.detalles}
                      </p>
                    </div>

                    <div>
                      <h4
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: 'var(--color-ink, #F3EEE2)',
                          marginBottom: '0.6rem',
                        }}
                      >
                        Secuencia del protocolo:
                      </h4>
                      <ol
                        style={{
                          margin: 0,
                          paddingLeft: '1.2rem',
                          fontSize: '0.86rem',
                          color: 'var(--color-ink-muted, #B9C4B7)',
                          lineHeight: 1.7,
                        }}
                      >
                        {t.protocolo.map((paso, idx) => (
                          <li key={idx}>{paso}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
