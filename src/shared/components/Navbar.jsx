export default function Navbar({ onCtaClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-mark">Origen Spa & Bienestar</span>
        <div className="navbar-actions">
          <a href="/staff/leads" className="navbar-staff-link">
            Panel Staff
          </a>
          <button className="navbar-cta" onClick={onCtaClick}>
            Reservar diagnóstico
          </button>
        </div>
      </div>
    </nav>
  )
}
