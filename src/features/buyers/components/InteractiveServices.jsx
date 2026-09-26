import { useState } from 'react'

const CATEGORIAS = ['Todos', 'Faciales', 'Masajes', 'Corporales', 'Rituales']

const CATALOGO = [
  {
    id: 'facial-hidratante',
    categoria: 'Faciales',
    nombre: 'Facial Hidratante Intensivo',
    tag: 'Más solicitado',
    duracion: '60 min',
    precio: 'Desde S/ 80',
    descripcion: 'Tratamiento hidronutritivo con activos biocompatibles y ácido hialurónico para devolver flexibilidad y tersura a la piel.',
    beneficios: ['Restablece la barrera cutánea', 'Atenúa líneas de deshidratación', 'Aporta luminosidad inmediata'],
    protocolo: [
      'Doble limpieza con emulsión botánica',
      'Exfoliación suave con microesferas de jojoba',
      'Vaporización tibia y tonificación con hidrolatos',
      'Mascarilla hidroplástica selladora',
      'Masaje facial de estimulación circulatoria',
    ],
  },
  {
    id: 'limpieza-profunda',
    categoria: 'Faciales',
    nombre: 'Limpieza Facial Profunda con Ozono',
    tag: 'Esencial',
    duracion: '60 min',
    precio: 'Desde S/ 95',
    descripcion: 'Higiene cutánea integral con vapor de ozono y alta frecuencia para eliminar impurezas sin agredir el tejido.',
    beneficios: ['Desobstrucción profunda de poros', 'Efecto descongestivo y bactericida', 'Textura suave y oxigenada'],
    protocolo: [
      'Desmaquillado y peeling ultrasónico',
      'Vapor de ozono desincrustante',
      'Extracción suave no lesiva',
      'Alta frecuencia calmante y antiséptica',
      'Velo de colágeno hidratante y fotoprotección',
    ],
  },
  {
    id: 'masaje-descontracturante',
    categoria: 'Masajes',
    nombre: 'Masaje Descontracturante & Cuello',
    tag: 'Alivio rápido',
    duracion: '60 o 90 min',
    precio: 'Desde S/ 90',
    descripcion: 'Presión media-alta enfocada en nudos musculares de espalda, trapecio y hombros por fatiga postural o estrés.',
    beneficios: ['Disuelve contracturas crónicas', 'Mejora la circulación y movilidad', 'Disminuye dolores de cabeza tensionales'],
    protocolo: [
      'Diagnóstico postural rápido',
      'Aplicación de toallas térmicas herbales',
      'Terapia manual profunda sobre puntos gatillo',
      'Estiramientos miofasciales asistidos',
      'Aplicación de bálsamo antiinflamatorio natural',
    ],
  },
  {
    id: 'masaje-piedras',
    categoria: 'Masajes',
    nombre: 'Masaje Relajante con Piedras Volcánicas',
    tag: 'Experiencia Spa',
    duracion: '75 min',
    precio: 'Desde S/ 110',
    descripcion: 'Combinación armoniosa de masaje sueco tradicional con termoterapia de piedras de basalto caliente para una relajación profunda.',
    beneficios: ['Alivio de fatiga y ansiedad', 'Relajación profunda del sistema nervioso', 'Efecto sedante natural'],
    protocolo: [
      'Inhalación aromática con lavanda y bergamota',
      'Pase de piedras calientes sobre meridianos energéticos',
      'Maniobras fluidas envolventes de cuerpo entero',
      'Bruma relajante de azahar y reposo tibio',
    ],
  },
  {
    id: 'ritual-corporal',
    categoria: 'Corporales',
    nombre: 'Ritual Corporal Exfoliante & Nutritivo',
    tag: 'Piel de seda',
    duracion: '75 min',
    precio: 'Desde S/ 140',
    descripcion: 'Renovación epidérmica con sales minerales y envoltura corporal de fango termal o chocolate antioxidante.',
    beneficios: ['Piel extremadamente suave y satinada', 'Activación del drenaje linfático', 'Desintoxicación celular'],
    protocolo: [
      'Gommage exfoliante con sales del mar peruano',
      'Retiro con toallas calientes perfumadas',
      'Envoltura térmica según necesidad (hidratante o détox)',
      'Hidratación final con emulsión de almendras y karité',
    ],
  },
  {
    id: 'diagnostico-gratis',
    categoria: 'Rituales',
    nombre: 'Diagnóstico Facial Personalizado',
    tag: '100% Gratuito',
    duracion: '45 min',
    precio: 'Gratis',
    descripcion: 'Evaluación profesional de tu biotipo cutáneo con lámpara de aumento para diseñar tu propuesta ideal sin compromiso.',
    beneficios: ['Identificación de necesidades reales', 'Recomendación experta de rutina diaria', 'Sin costo para nuevos visitantes'],
    protocolo: [
      'Test de hidratación y nivel de sebo',
      'Inspección dérmica con luz polarizada',
      'Plan personalizado con metodología IMPULSE',
      'Entrega de guía digital de cuidados',
    ],
  },
]

export default function InteractiveServices({ onSelectTreatment }) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [servicioModal, setServicioModal] = useState(null)

  const filtrados = categoriaActiva === 'Todos'
    ? CATALOGO
    : CATALOGO.filter((s) => s.categoria === categoriaActiva)

  function handleSelect(nombre) {
    if (onSelectTreatment) {
      onSelectTreatment(nombre)
    }
  }

  return (
    <section className="section section-line" id="servicios">
      <div className="container">
        {/* Cabecera de la sección */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span
            style={{
              color: 'var(--color-brand, #2d6a4f)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Catálogo Interactivo de Experiencias
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', margin: '0 0 0.8rem 0' }}>
            Tratamientos &amp; Rituales de Bienestar
          </h2>
          <p style={{ color: '#555', maxWidth: '620px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Explora nuestra carta de protocolos exclusivos. Puedes filtrar por categoría, revisar el protocolo paso a paso o pre-agendar tu sesión directamente.
          </p>

          {/* Filtros por Categoría */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '1.8rem',
            }}
          >
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '25px',
                  border: categoriaActiva === cat ? '1px solid #2d6a4f' : '1px solid #ddd',
                  background: categoriaActiva === cat ? '#2d6a4f' : '#ffffff',
                  color: categoriaActiva === cat ? '#ffffff' : '#333333',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: categoriaActiva === cat ? '0 4px 10px rgba(45, 106, 79, 0.25)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Tarjetas de Servicio */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filtrados.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e9ecef',
                padding: '1.6rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span
                    style={{
                      background: 'rgba(45, 106, 79, 0.1)',
                      color: '#2d6a4f',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {s.tag}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 500 }}>
                    ⏱️ {s.duracion}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#1a1a1a', fontWeight: 700 }}>
                  {s.nombre}
                </h3>
                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {s.descripcion}
                </p>

                {/* Beneficios clave */}
                <div style={{ marginBottom: '1.2rem' }}>
                  {s.beneficios.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        fontSize: '0.82rem',
                        color: '#444',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#2d6a4f', fontWeight: 'bold' }}>✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer de la tarjeta con precio y acciones */}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#888', textTransform: 'uppercase' }}>Inversión</span>
                    <strong style={{ fontSize: '1.15rem', color: '#2d6a4f' }}>{s.precio}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setServicioModal(s)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#52796f',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Ver protocolo 📋
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(s.nombre)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2d6a4f',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1b4332' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#2d6a4f' }}
                >
                  <span>Reservar este tratamiento</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Detalle de Protocolo */}
        {servicioModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(5px)',
              padding: '1rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setServicioModal(null)
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '2rem',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              <button
                type="button"
                onClick={() => setServicioModal(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: '#888',
                }}
              >
                ×
              </button>

              <span
                style={{
                  background: 'rgba(45, 106, 79, 0.12)',
                  color: '#2d6a4f',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {servicioModal.categoria} · {servicioModal.duracion}
              </span>

              <h3 style={{ fontSize: '1.4rem', margin: '0.6rem 0 0.4rem 0', color: '#111' }}>
                {servicioModal.nombre}
              </h3>

              <p style={{ color: '#555', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                {servicioModal.descripcion}
              </p>

              <h4 style={{ fontSize: '0.95rem', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                Protocolo Clínico Paso a Paso:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                {servicioModal.protocolo.map((paso, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#f8f9fa',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#333',
                    }}
                  >
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#2d6a4f',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span>{paso}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(servicioModal.nombre)
                    setServicioModal(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2d6a4f',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Solicitar este tratamiento ({servicioModal.precio})
                </button>
                <button
                  type="button"
                  onClick={() => setServicioModal(null)}
                  style={{
                    padding: '0.85rem 1.2rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: 'transparent',
                    color: '#666',
                    cursor: 'pointer',
                  }}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
