export default function Navbar({ onCtaClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-mark">Origen Spa & Bienestar</span>
        <button className="navbar-cta" onClick={onCtaClick}>
          Reservar diagnóstico
        </button>
      </div>
    </nav>
  )
}
