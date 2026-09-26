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
      
      {/* Catálogo Interactivo y Editorial de Servicios */}
      <InteractiveServices onSelectTreatment={handleSelectTreatment} />

      {/* Orientación Técnica de Tratamiento */}
      <section className="section section-line" style={{ background: 'var(--color-bg, #16231C)' }}>
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
                  color: 'var(--color-accent-dark, #A87F45)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Primer Contacto · Sin Costo
              </span>
              <h2>Tu primer diagnóstico es gratis</h2>
              <p>
                Cuéntanos un poco sobre tu piel y te enviamos una guía personalizada además de
                los horarios disponibles para tu diagnóstico presencial, sin costo.
              </p>
              {selectedTreatment && (
                <div
                  style={{
                    marginTop: '1.2rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--color-line-contrast, rgba(27, 42, 33, 0.18))',
                    background: 'rgba(27, 42, 33, 0.05)',
                    color: 'var(--color-ink-on-contrast, #1B2A21)',
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Tratamiento pre-seleccionado: <strong>{selectedTreatment}</strong>. Evaluaremos tu piel en función de este protocolo.
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
