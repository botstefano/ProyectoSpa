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

        <div className="hero-video-container">
          <iframe
            className="hero-video"
            src="https://www.youtube.com/embed/SQ9Q8grIi0k?si=LCD24IPEqWxXmEo4"
            title="Origen Spa & Bienestar - Video de presentación"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </header>
  )
}
