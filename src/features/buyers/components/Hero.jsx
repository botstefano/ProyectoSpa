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

        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          controls
          poster="/video/origen_spa_bienestar_ad.mp4"
        >
          <source src="/video/origen_spa_bienestar_ad.mp4" type="video/mp4" />
          Tu navegador no soporta videos HTML5.
        </video>
      </div>
    </header>
  )
}
