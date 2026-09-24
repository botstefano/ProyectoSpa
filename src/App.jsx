import { Routes, Route } from 'react-router-dom'
import BuyersLanding from './features/buyers/BuyersLanding'
import LeadsStaffPage from './features/leads/LeadsStaffPage'
import PayersStaffPage from './features/payers/PayersStaffPage'
import CustomersStaffPage from './features/customers/CustomersStaffPage'
import EnriquecimientoPage from './features/enriquecimiento/EnriquecimientoPage'

export default function App() {
  return (
    <Routes>
      {/* Fase 1 — pública, es la landing real del spa */}
      <Route path="/" element={<BuyersLanding />} />

      {/* Formulario público de enriquecimiento */}
      <Route path="/enriquecimiento/:token" element={<EnriquecimientoPage />} />

      {/* Fases 2-4 — paneles internos (staff), no enlazados desde la landing */}
      <Route path="/staff/leads" element={<LeadsStaffPage />} />
      <Route path="/staff/payers" element={<PayersStaffPage />} />
      <Route path="/staff/customers" element={<CustomersStaffPage />} />
    </Routes>
  )
}
