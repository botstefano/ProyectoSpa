import { useRef } from 'react'
import Navbar from '../../shared/components/Navbar'
import Footer from '../../shared/components/Footer'
import Hero from './components/Hero'
import WhyUs from './components/WhyUs'
import Services from './components/Services'
import LeadForm from './components/LeadForm'

export default function BuyersLanding() {
  const formSectionRef = useRef(null)

  function scrollToForm() {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar onCtaClick={scrollToForm} />
      <Hero onCtaClick={scrollToForm} />
      <WhyUs />
      <Services />

      <section className="section form-section" ref={formSectionRef}>
        <div className="container section-line" style={{ paddingTop: '3.5rem' }}>
          <div className="form-grid">
            <div className="form-intro">
              <h2>Tu primer diagnóstico es gratis</h2>
              <p>
                Cuéntanos un poco sobre tu piel y te enviamos una guía personalizada además de
                los horarios disponibles para tu diagnóstico presencial, sin costo.
              </p>
            </div>
            <LeadForm />
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
