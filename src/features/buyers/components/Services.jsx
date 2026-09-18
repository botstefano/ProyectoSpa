const SERVICIOS = [
  {
    nombre: 'Facial hidratante',
    desc: 'Limpieza profunda, exfoliación e hidratación intensiva según tu tipo de piel.',
    precio: 'Desde S/ 80',
  },
  {
    nombre: 'Masaje descontracturante',
    desc: 'Libera tensión acumulada en espalda, cuello y hombros. 60 u 90 minutos.',
    precio: 'Desde S/ 90',
  },
  {
    nombre: 'Ritual corporal relajante',
    desc: 'Exfoliación corporal + envoltura + masaje. Pensado para una tarde completa de desconexión.',
    precio: 'Desde S/ 140',
  },
  {
    nombre: 'Diagnóstico de piel',
    desc: 'Evaluación con especialista y recomendación personalizada. Es tu primer paso, y es gratis.',
    precio: 'Gratis',
  },
]

export default function Services() {
  return (
    <section className="section section-line" id="servicios">
      <div className="container">
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.3rem)' }}>Tratamientos</h2>
        <div className="services-list">
          {SERVICIOS.map((s) => (
            <div className="service-row" key={s.nombre}>
              <span className="service-name">{s.nombre}</span>
              <span className="service-desc">{s.desc}</span>
              <span className="service-price">{s.precio}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
