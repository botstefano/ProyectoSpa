import { useRef, useState } from 'react'
import Navbar from '../../shared/components/Navbar'
import Footer from '../../shared/components/Footer'
import Hero from './components/Hero'
import WhyUs from './components/WhyUs'
import InteractiveServices from './components/InteractiveServices'
import SpaQuizWidget from './components/SpaQuizWidget'
import LeadForm from './components/LeadForm'

export default function BuyersLanding() {
  const formSectionRef = useRef(null)
  const [selectedTreatment, setSelectedTreatment] = useState('')

  function scrollToForm() {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleSelectTreatment(treatmentName) {
    setSelectedTreatment(treatmentName)
    scrollToForm()
  }

  return (
    <>
      <Navbar onCtaClick={scrollToForm} />
      <Hero onCtaClick={scrollToForm} />
      <WhyUs />
      
      {/* Catálogo Interactivo de Servicios */}
      <InteractiveServices onSelectTreatment={handleSelectTreatment} />

      {/* Widget Interactivo de Diagnóstico Rápido */}
      <section style={{ backgroundColor: '#0d1d15', padding: '3rem 0' }}>
        <div className="container">
          <SpaQuizWidget onSelectTreatment={handleSelectTreatment} />
        </div>
      </section>

      {/* Sección del Formulario de Captación */}
      <section className="section form-section" ref={formSectionRef}>
        <div className="container section-line" style={{ paddingTop: '3.5rem' }}>
          <div className="form-grid">
            <div className="form-intro">
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
                Fase 1: Diagnóstico Gratuito
              </span>
              <h2>Tu primer diagnóstico es sin costo</h2>
              <p>
                Cuéntanos un poco sobre tu piel y te enviamos una guía personalizada además de
                los horarios disponibles para tu diagnóstico presencial, sin costo.
              </p>
              {selectedTreatment && (
                <div
                  style={{
                    marginTop: '1.2rem',
                    padding: '0.9rem 1.2rem',
                    borderRadius: '10px',
                    background: '#e8f5e9',
                    border: '1px solid #81c784',
                    color: '#1b5e20',
                    fontSize: '0.92rem',
                  }}
                >
                  🌿 Hemos pre-seleccionado <strong>{selectedTreatment}</strong> en tu solicitud. Nuestro especialista adaptará el diagnóstico en base a este servicio.
                </div>
              )}
            </div>
            <LeadForm selectedTreatment={selectedTreatment} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
