const RAZONES = [
  {
    title: 'Diagnóstico real, no genérico',
    body: 'Cada tratamiento se define después de evaluar tu tipo de piel, no de un menú fijo de servicios.',
  },
  {
    title: 'Especialistas certificadas',
    body: 'Formación continua en cosmetología y masoterapia, con protocolos revisados cada trimestre.',
  },
  {
    title: 'Tu horario, sin fricción',
    body: 'Agenda en menos de un minuto y recibe recordatorios para que nunca pierdas tu cita.',
  },
]

export default function WhyUs() {
  return (
    <section className="section section-line">
      <div className="container">
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.3rem)', maxWidth: '20ch' }}>
          Cuidado personal, sin restarte tiempo
        </h2>
        <div className="why-grid">
          {RAZONES.map((r) => (
            <div className="why-item" key={r.title}>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
