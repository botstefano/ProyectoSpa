export default function Hero({ onCtaClick }) {
  return (
    <header className="hero">
      <div className="container hero-grid">
        <div>
          <h1 className="hero-heading">Un momento para volver a ti</h1>
          <p className="hero-sub">
            Diagnóstico facial gratuito, tratamientos personalizados y un espacio pensado para
            quienes no tienen tiempo que perder — pero sí piel que cuidar.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onCtaClick}>
              Solicitar diagnóstico gratuito
            </button>
            <a className="btn-ghost" href="#servicios">
              Ver tratamientos
            </a>
          </div>
        </div>

        <svg
          className="hero-illustration"
          viewBox="0 0 420 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Ilustración lineal de una rama con hojas"
        >
          <path
            d="M210 380 C205 300 215 220 208 60"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
          <path
            d="M208 120 C240 108 268 82 272 40"
            stroke="var(--color-clay)"
            strokeWidth="1.5"
          />
          <path
            d="M208 180 C172 168 146 140 140 100"
            stroke="var(--color-clay)"
            strokeWidth="1.5"
          />
          <path
            d="M209 240 C246 232 278 208 288 172"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
          <path
            d="M208 300 C168 292 134 266 122 228"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
          <circle cx="210" cy="60" r="5" stroke="var(--color-clay)" strokeWidth="1.5" />
        </svg>
      </div>
    </header>
  )
}
