// Fase 4 — CUSTOMERS (Aguirre Silva Jersson Alessandro)
//
// Pantalla interna: prototipo de Atención/Registro de Servicio. Debe leer
// pago_detalle.estado_pago para habilitar el registro, y guardar los
// detalles del servicio prestado (tipo de tratamiento, especialista,
// duración, notas) en atencion_detalle.
//
// Tablas a usar:
//   - contacto           (leer)
//   - pago_detalle       (leer: estado_pago — solo lectura, es de Fase 3)
//   - atencion_detalle   (leer/escribir: preferencias_servicio — propiedad de esta fase)
//
// Sugerencia de estructura (mismo patrón que src/features/buyers/):
//   src/features/customers/
//     CustomersStaffPage.jsx
//     components/
//       ServiceRegistryForm.jsx
//     api/
//       customersApi.js

export default function CustomersStaffPage() {
  return (
    <div className="staff-shell">
      <header className="staff-header">
        <span className="navbar-mark">Panel interno — Atención</span>
      </header>
      <div className="staff-placeholder">
        <h2>Registro de Servicio (Fase 4)</h2>
        <p>
          Pendiente de implementación. Debe leer <code>pago_detalle.estado_pago</code> para
          habilitar el registro, y guardar el detalle del servicio en{' '}
          <code>atencion_detalle</code>.
        </p>
      </div>
    </div>
  )
}
