import { useState, useEffect } from "react";
import { obtenerLeads, calificarLead, aceptarPropuesta } from "./api/leadsApi";

const TABS = ["Perfil","Propuesta","Historial","Notas","Actividades"];

function tempClass(t) {
  if (t === "Caliente") return "ln-temp caliente";
  if (t === "Tibio")    return "ln-temp tibio";
  return "ln-temp frio";
}

function calcularTemperatura(score) {
  if (score >= 65) return "Caliente";
  if (score >= 45) return "Tibio";
  return "Frio";
}

function generarIniciales(nombre) {
  if (!nombre) return "??";
  const partes = nombre.trim().split(" ");
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return nombre.substring(0, 2).toUpperCase();
}

function ScoreRing({ score }) {
  const r = 28, c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const col = score >= 65 ? "#b7d2b9" : score >= 45 ? "#e8ca8f" : "#D9AFA0";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(243,238,226,0.1)" strokeWidth="6"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="6"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 36 36)" style={{transition:"stroke-dashoffset .6s ease"}}/>
      <text x="36" y="41" textAnchor="middle" fill={col} fontSize="15" fontWeight="700"
        fontFamily="Manrope,sans-serif">{score}</text>
    </svg>
  );
}

function IcoBell()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IcoCaret()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>; }
function IcoCal()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/></svg>; }
function IcoHome()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcoMsg()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function IcoStar()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IcoSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></svg>; }
function IcoCheck()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}><circle cx="7" cy="7" r="7" fill="rgba(183,210,185,0.18)"/><path d="M4 7l2 2 4-4" stroke="#b7d2b9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoSend()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function IcoSave()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function IcoWA()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>; }

export default function LeadsStaffPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selId, setSelId] = useState(null);
  const [tab, setTab] = useState("Propuesta");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);

  function show(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  useEffect(() => {
    async function cargarDatos() {
      try {
        const data = await obtenerLeads();
        
        const leadsMapeados = data.map(dbLead => {
          const scoreReal = dbLead.lead_detalle?.lead_score || 0;
          const interesReal = dbLead.descarga?.[0]?.interes || "Tratamiento facial";
          const nombrePlano = interesReal.charAt(0).toUpperCase() + interesReal.slice(1);
          
          return {
            id: dbLead.id_contacto,
            iniciales: generarIniciales(dbLead.nombre),
            nombre: dbLead.nombre,
            servicio: nombrePlano,
            score: scoreReal,
            temp: calcularTemperatura(scoreReal),
            cita: "Pendiente de agendar",
            interes: nombrePlano,
            presupuesto: "S/ 100 - S/ 150", 
            disponibilidad: "Por confirmar", 
            frase: "Capturado desde la landing page.",
            tags: ["#LeadNuevo", `#${nombrePlano.replace(/\s+/g, '')}`],
            perfil: { 
              edad: 30, 
              ocupacion: "No especificado", 
              distrito: "Trujillo", 
              email: dbLead.email || "No provisto", 
              telefono: dbLead.telefono || "No provisto" 
            },
            propuesta: { 
              nombre: `Paquete ${nombrePlano}`, 
              desc: "Propuesta generada automáticamente basada en el interés.",
              tags: ["Recomendado", "Bienestar"],
              duracion: "60 min", precioRegular: "S/ 150.00", precioEspecial: "S/ 120.00", ahorro: "S/ 30.00", descuento: "20%",
              incluye: "Evaluación inicial, tratamiento y seguimiento." 
            },
            porQue: ["Se adapta a su interés inicial.", "Resultados visibles desde la primera sesión.", "Contribuye a su bienestar."],
            notas: "Lead ingresado mediante formulario público. Pendiente de contacto."
          };
        });
        
        setLeads(leadsMapeados);
        if (leadsMapeados.length > 0) setSelId(leadsMapeados[0].id);
      } catch (err) {
        show("Error al cargar leads desde la Base de Datos.");
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  const handleUpdateScore = async (id, newScore) => {
    try {
      await calificarLead(id, newScore);
      setLeads(prev => prev.map(l =>
        l.id === id ? { ...l, score: newScore, temp: calcularTemperatura(newScore) } : l
      ));
      show("Lead Score actualizado con éxito");
      if (newScore >= 50) {
        show("Lead calificado y transicionado a estado LEAD");
      }
    } catch (err) {
      show("Error al actualizar Score");
    }
  };

  const handleAcceptProposal = async (id) => {
    try {
      const propuesta = {
        nombre: lead.propuesta.nombre,
        precio: lead.propuesta.precioEspecial,
        servicio: lead.interes
      };
      await aceptarPropuesta(id, propuesta);
      show("Propuesta aceptada. Lead listo para pasar a PAYERS");
    } catch (err) {
      show("Error al aceptar propuesta");
    }
  };

  const list = leads.filter(l =>
    l.nombre?.toLowerCase().includes(query.toLowerCase()) ||
    l.servicio?.toLowerCase().includes(query.toLowerCase())
  );

  const lead = leads.find(l => l.id === selId) || leads[0];
  const fn = lead ? lead.nombre.split(" ")[0] : "";

  if (loading) {
    return (
      <div className="ln-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2>Cargando leads desde Supabase...</h2>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="ln-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2>No hay leads registrados aún. Llena el formulario en la landing page para empezar.</h2>
      </div>
    );
  }

  return (
    <div className="ln-shell">
      {/* ══ NAVBAR ══ */}
      <header className="ln-navbar">
        <div className="ln-navbar-inner">
          <div className="ln-brand">
            <span className="ln-brand-leaf">✦</span>
            <div>
              <span className="navbar-mark" style={{fontSize:"1rem",display:"block"}}>Origen Spa &amp; Bienestar</span>
              <span className="ln-brand-sub">Belleza · Equilibrio · Tu mejor versión</span>
            </div>
          </div>
          <nav className="ln-nav">
            <a href="/">Inicio</a>
            <a href="/staff/leads" className="ln-nav-active">Clientes</a>
            <a href="#">Servicios</a>
            <a href="#">Citas</a>
            <a href="#">Reportes</a>
          </nav>
          <div className="ln-navbar-right">
            <button className="ln-icon-btn">
              <IcoBell/>
              <span className="ln-badge">3</span>
            </button>
            <button className="ln-agent-btn">
              <div className="ln-agent-avatar">A</div>
              <span>Hola, Agente</span>
              <IcoCaret/>
            </button>
          </div>
        </div>
      </header>

      {/* ══ LAYOUT ══ */}
      <div className="ln-layout">

        {/* ── SIDEBAR ── */}
        <aside className="ln-sidebar">
          <p className="ln-sidebar-title">Buscar Lead</p>
          <div className="ln-search">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <IcoSearch/>
          </div>

          <ul className="ln-list">
            {list.map(l => (
              <li key={l.id}
                className={"ln-item" + (l.id === selId ? " active" : "")}
                onClick={() => { setSelId(l.id); setTab("Propuesta"); }}>
                <div className="ln-item-av">{l.iniciales}</div>
                <div className="ln-item-info">
                  <strong>{l.nombre}</strong>
                  <span>{l.servicio}</span>
                </div>
                <div className="ln-item-right">
                  <span className="ln-score-pill">{l.score}</span>
                  <span className={tempClass(l.temp)}>{l.temp}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="ln-list-note">Mostrando {list.length} leads</p>
          <p className="ln-list-tagline">Personas reales,<br/>bienestar real ✦</p>
        </aside>

        {/* ── MAIN ── */}
        <main className="ln-main">

          {/* Page title */}
          <div className="ln-page-header">
            <div>
              <h1 className="ln-page-title">Perfil de Negociación</h1>
              <p className="ln-page-sub">Convierte cada interés en una experiencia de bienestar</p>
            </div>
            <p className="ln-quote">&ldquo;Cuidarte hoy es invertir en la mejor versión de ti&rdquo;</p>
            <button className="ln-back-btn" onClick={() => show("Volviendo al listado...")}>
              ← Volver al listado
            </button>
          </div>

          {/* Lead hero */}
          <div className="ln-hero">
            <div className="ln-hero-av">{lead.iniciales}</div>
            <div className="ln-hero-body">
              <div className="ln-hero-name-row">
                <h2 className="ln-hero-name">{lead.nombre}</h2>
                <span className={tempClass(lead.temp)}>{lead.temp}</span>
              </div>
              <p className="ln-hero-sub">Lead calificado · Interesada en {lead.interes}</p>
              <p className="ln-hero-frase">&ldquo;{lead.frase}&rdquo;</p>
              <div className="ln-tags">
                {lead.tags.map(t => <span key={t} className="ln-tag">{t}</span>)}
              </div>
            </div>
            <div className="ln-hero-score">
              <p className="ln-score-label">Lead Score</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button onClick={() => handleUpdateScore(lead.id, Math.max(0, lead.score - 5))} style={{background: 'none', border: '1px solid rgba(243,238,226,0.2)', color: 'var(--color-ink-muted)', cursor: 'pointer', borderRadius: '4px', padding: '0.2rem 0.5rem'}}>-</button>
                <ScoreRing score={lead.score}/>
                <button onClick={() => handleUpdateScore(lead.id, Math.min(100, lead.score + 5))} style={{background: 'none', border: '1px solid rgba(243,238,226,0.2)', color: 'var(--color-ink-muted)', cursor: 'pointer', borderRadius: '4px', padding: '0.2rem 0.5rem'}}>+</button>
              </div>
              <p className="ln-score-sub">/ 100</p>
              <p className="ln-score-desc">
                {lead.score >= 65 ? "Alta probabilidad de conversión"
                  : lead.score >= 45 ? "Probabilidad media"
                  : "Requiere seguimiento"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="ln-tabs">
            {TABS.map(t => (
              <button key={t} className={"ln-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
                {t === "Perfil"      && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                {t === "Propuesta"   && <IcoStar/>}
                {t === "Historial"   && <IcoCal/>}
                {t === "Notas"       && <IcoMsg/>}
                {t === "Actividades" && <IcoHome/>}
                {t}
              </button>
            ))}
          </div>

          {/* ── TAB: PERFIL ── */}
          {tab === "Perfil" && (
            <div className="ln-grid-2">
              <article className="ln-card">
                <h3 className="ln-card-title">Datos personales</h3>
                <div className="ln-rows">
                  {[["Nombre completo", lead.nombre],["Edad", lead.perfil.edad+" años"],
                    ["Ocupación", lead.perfil.ocupacion],["Distrito", lead.perfil.distrito],
                    ["Email", lead.perfil.email],["Teléfono", lead.perfil.telefono]].map(([k,v]) => (
                    <div key={k} className="ln-row"><span>{k}</span><strong>{v}</strong></div>
                  ))}
                </div>
              </article>
              <article className="ln-card">
                <h3 className="ln-card-title">Preferencias</h3>
                <div className="ln-rows">
                  {[["Interés", lead.interes],["Presupuesto", lead.presupuesto],
                    ["Disponibilidad", lead.disponibilidad],["Temperatura", lead.temp],
                    ["Lead Score", lead.score+"/100"]].map(([k,v]) => (
                    <div key={k} className="ln-row"><span>{k}</span><strong>{v}</strong></div>
                  ))}
                </div>
              </article>
              <article className="ln-card ln-span2">
                <h3 className="ln-card-title">Cita sugerida</h3>
                <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginTop:"0.5rem"}}>
                  <IcoCal/><span style={{fontSize:"0.85rem"}}>{lead.cita}</span>
                </div>
              </article>
            </div>
          )}

          {/* ── TAB: PROPUESTA ── */}
          {tab === "Propuesta" && (
            <div className="ln-propuesta-layout">
              {/* Centro */}
              <div className="ln-propuesta-center">
                <article className="ln-card ln-prop-card">
                  <div className="ln-prop-head">
                    <div>
                      <h3 className="ln-card-title" style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        <IcoStar/> Propuesta personalizada
                      </h3>
                      <p className="ln-muted" style={{fontSize:"0.7rem"}}>Diseñada según sus intereses, preferencias y estilo de vida.</p>
                    </div>
                    <button className="ln-btn-ghost" onClick={() => show("Generando nueva propuesta...")}>Generar otra propuesta</button>
                  </div>

                  <div className="ln-prop-body">
                    <div className="ln-prop-visual">
                      <div className="ln-prop-visual-overlay">
                        <p style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",marginBottom:"0.3rem"}}>Tu momento, nuestra prioridad</p>
                        <p className="ln-muted" style={{fontSize:"0.7rem"}}>Piel saludable, mente tranquila</p>
                        <div className="ln-prop-visual-badges">
                          <span>✓ Resultados visibles</span>
                          <span>✓ Atención personalizada</span>
                          <span>✓ Ambiente relajante</span>
                        </div>
                      </div>
                    </div>
                    <div className="ln-prop-detail">
                      <span className="ln-recomendado">RECOMENDADO PARA {fn.toUpperCase()}</span>
                      <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",margin:"0.4rem 0 0.15rem"}}>{lead.propuesta.nombre}</h3>
                      <p className="ln-muted" style={{fontSize:"0.72rem",marginBottom:"0.5rem"}}>{lead.propuesta.desc}</p>
                      <div className="ln-tags" style={{marginBottom:"0.65rem"}}>
                        {lead.propuesta.tags.map(t => <span key={t} className="ln-tag">{t}</span>)}
                      </div>
                      <div className="ln-precio-row">
                        <span className="ln-muted" style={{fontSize:"0.72rem"}}>&#9200; {lead.propuesta.duracion}</span>
                        <span className="ln-muted" style={{fontSize:"0.72rem"}}><s>{lead.propuesta.precioRegular}</s></span>
                        <span className="ln-precio-especial">{lead.propuesta.precioEspecial}</span>
                        <span className="ln-discount">&minus;{lead.propuesta.descuento}</span>
                      </div>
                      <p className="ln-ahorro">Te ahorras {lead.propuesta.ahorro}</p>
                      <p style={{fontSize:"0.72rem",color:"var(--color-ink-muted)"}}>
                        <strong style={{color:"var(--color-ink)"}}>Incluye:</strong> {lead.propuesta.incluye}
                      </p>
                    </div>
                  </div>

                  <div className="ln-prop-footer">
                    <div className="ln-info-block">
                      <IcoCal/>
                      <div>
                        <strong>Fecha y horario sugerido</strong>
                        <p>{lead.cita}</p>
                        <button className="ln-link-btn" onClick={() => show("Cambiando fecha...")}>Cambiar</button>
                      </div>
                    </div>
                    <div className="ln-info-block">
                      <IcoHome/>
                      <div>
                        <strong>Experiencia en Origen Spa</strong>
                        <p>&#10003; Ambientes tranquilos y privados</p>
                        <p>&#10003; Terapeutas certificadas</p>
                        <p>&#10003; Música relajante</p>
                        <p>&#10003; Estacionamiento disponible</p>
                      </div>
                    </div>
                    <div className="ln-info-block">
                      <IcoMsg/>
                      <div>
                        <strong>Testimonio que inspira</strong>
                        <p style={{fontStyle:"italic"}}>&ldquo;Mi piel se ve increíble desde la primera sesión. El ambiente es hermoso.&rdquo;</p>
                        <p style={{color:"var(--color-accent)",fontSize:"0.65rem"}}>&#8212; Valeria M. · Cliente frecuente</p>
                      </div>
                    </div>
                  </div>

                  <div className="ln-cta-row">
                    <button className="ln-btn-primary" onClick={() => handleAcceptProposal(lead.id)}>
                      <IcoCheck/> Aceptar propuesta → Pasar a PAYERS
                    </button>
                    <button className="ln-btn-wa" onClick={() => show("Propuesta enviada por WhatsApp")}>
                      <IcoWA/> Enviar por WhatsApp
                    </button>
                    <button className="ln-btn-ghost" onClick={() => show("Propuesta guardada")}>
                      <IcoSave/> Guardar propuesta
                    </button>
                  </div>

                  <p className="ln-tagline-bottom">&#10022; Una piel sana es el inicio de una vida más segura y feliz.</p>
                  {toast && <div className="ln-toast" role="status">{toast}</div>}
                </article>
              </div>

              {/* Derecha */}
              <div className="ln-propuesta-right">
                <article className="ln-card">
                  <h3 className="ln-card-title" style={{marginBottom:"0.7rem"}}>¿Por qué es ideal para {fn}?</h3>
                  <ul className="ln-porque">
                    {lead.porQue.map((r,i) => (
                      <li key={i}><IcoCheck/><span>{r}</span></li>
                    ))}
                  </ul>
                </article>

                <article className="ln-card" style={{marginTop:"0.7rem"}}>
                  <h3 className="ln-card-title" style={{marginBottom:"0.55rem"}}>&#129302; Recomendación del Agente IA</h3>
                  <p style={{fontSize:"0.72rem",color:"var(--color-ink-muted)",lineHeight:1.55}}>
                    Este lead tiene una alta probabilidad de conversión. Se recomienda enviar la propuesta por WhatsApp y hacer seguimiento en 24 horas.
                  </p>
                  <button className="ln-btn-primary" style={{marginTop:"0.75rem",width:"100%",fontSize:"0.72rem",justifyContent:"center"}}
                    onClick={() => show("Seguimiento automatizado activado")}>
                    <IcoSend/> Automatizar seguimiento
                  </button>
                </article>

                <article className="ln-card ln-countdown-card" style={{marginTop:"0.7rem"}}>
                  <p className="ln-countdown-title">&#127873; Beneficio exclusivo por tiempo limitado</p>
                  <p style={{fontSize:"0.7rem",color:"var(--color-ink-muted)",marginBottom:"0.65rem"}}>
                    Agenda hoy y recibe una sesión de masaje relajante de 15 minutos ¡GRATIS!
                  </p>
                  <div className="ln-countdown">
                    {[["02","Días"],["14","Horas"],["37","Min"],["20","Seg"]].map(([n,l]) => (
                      <div key={l} className="ln-countdown-cell">
                        <strong>{n}</strong><span>{l}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          )}

          {/* ── TAB: HISTORIAL ── */}
          {tab === "Historial" && (
            <article className="ln-card">
              <h3 className="ln-card-title">Historial de interacciones</h3>
              <p className="ln-muted" style={{marginTop:"0.75rem"}}>Sin interacciones registradas. Llamadas, mensajes y visitas aparecerán aquí.</p>
            </article>
          )}

          {/* ── TAB: NOTAS ── */}
          {tab === "Notas" && (
            <article className="ln-card">
              <h3 className="ln-card-title">Notas del agente</h3>
              <p className="ln-muted" style={{marginTop:"0.6rem",lineHeight:1.6}}>{lead.notas}</p>
              <textarea className="ln-textarea" placeholder="Agregar nueva nota..."
                value={note} onChange={e => setNote(e.target.value)}/>
              <button className="ln-btn-ghost" style={{marginTop:"0.6rem"}} onClick={() => { show("Nota guardada"); setNote(""); }}>
                Guardar nota
              </button>
            </article>
          )}

          {/* ── TAB: ACTIVIDADES ── */}
          {tab === "Actividades" && (
            <article className="ln-card">
              <h3 className="ln-card-title">Actividades programadas</h3>
              <p className="ln-muted" style={{marginTop:"0.75rem"}}>
                No hay actividades. Usa &ldquo;Automatizar seguimiento&rdquo; para crear una.
              </p>
            </article>
          )}

        </main>
      </div>

      <footer className="ln-footer">
        <span>&#169; 2026 Origen Spa &amp; Bienestar</span>
        <span>Sistema de Gestión · Fase 2: LEADS</span>
        <span>Relajación · Bienestar · Confianza</span>
      </footer>
    </div>
  );
}