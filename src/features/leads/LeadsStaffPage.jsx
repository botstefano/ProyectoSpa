// Fase 2 — LEADS (Herrera Payano Jhonatan Andres + Pelaez Roque Alexander Jan Pool)
//
// Esta es una pantalla INTERNA (staff), no pública como la de Fase 1.
// Aquí va el "Perfil de Negociación": buscador de leads, lead score,
// datos personales/estudiante/laborales, gustos y preferencias, estado del lead.
//
// Tablas a usar (ya existen en supabase/schema.sql):
//   - contacto        (leer: nombre, telefono, email — NO reinsertar, ya lo crea Fase 1)
//   - lead_detalle    (leer/escribir: lead_score, fecha_calificacion — es SOLO de esta fase)
//   - contacto_campana, mensajeenviado (lectura, para indicadores)
//
// Sugerencia de estructura, siguiendo el patrón de src/features/buyers/:
//   src/features/leads/
//     LeadsStaffPage.jsx        <- ensambla la página (como BuyersLanding.jsx)
//     components/
//       LeadSearchSidebar.jsx
//       NegotiationProfile.jsx
//     api/
//       leadsApi.js             <- funciones supabase.from('lead_detalle')...
//
// IMPORTANTE: esta pantalla no debe ser pública. Cuando agreguen autenticación
// (Supabase Auth), las políticas RLS de lead_detalle deben restringirse al rol
// "authenticated", no a "anon" como el formulario de Fase 1.

export default function LeadsStaffPage() {
  return (
    <div className="staff-shell">
      <header className="staff-header">
        <span className="navbar-mark">Panel interno — Leads</span>
      </header>
      <div className="staff-placeholder">
        <h2>Perfil de Negociación (Fase 2)</h2>
        <p>
          Esta pantalla está pendiente de implementación por el equipo de Fase 2. Debe mostrar un
          buscador de leads y, al seleccionar uno, su ficha completa: datos personales, gustos y
          preferencias, datos de estudiante/laborales, <code>lead_score</code> y estado del lead.
        </p>
        <p>
          Usa <code>contacto</code> (ya creado por Fase 1) y <code>lead_detalle</code> (de
          propiedad exclusiva de esta fase) desde <code>src/lib/supabaseClient.js</code>.
        </p>
      </div>
    </div>
  )
}
