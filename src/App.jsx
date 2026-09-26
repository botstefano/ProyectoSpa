import { Routes, Route } from 'react-router-dom'
import BuyersLanding from './features/buyers/BuyersLanding'
import LeadsStaffPage from './features/leads/LeadsStaffPage'
import PayersStaffPage from './features/payers/PayersStaffPage'
import PagoPublicoPage from './features/payers/PagoPublicoPage'
import CustomersStaffPage from './features/customers/CustomersStaffPage'
import EnriquecimientoPage from './features/enriquecimiento/EnriquecimientoPage'
import PropuestaChatbotPage from './features/propuestas/PropuestaChatbotPage'
import { StaffAuthProvider } from './features/auth/StaffAuthContext'
import StaffLoginModal from './features/auth/StaffLoginModal'
import StaffProtectedRoute from './features/auth/StaffProtectedRoute'

export default function App() {
  return (
    <StaffAuthProvider>
      <StaffLoginModal />
      <Routes>
        {/* Fase 1 — pública, es la landing real del spa */}
        <Route path="/" element={<BuyersLanding />} />

        {/* Formularios y vistas públicas del cliente */}
        <Route path="/enriquecimiento/:token" element={<EnriquecimientoPage />} />
        <Route path="/propuesta/:token" element={<PropuestaChatbotPage />} />
        <Route path="/pago/:token" element={<PagoPublicoPage />} />

        {/* Fases 2-4 — paneles internos protegidos del staff */}
        <Route
          path="/staff/leads"
          element={
            <StaffProtectedRoute>
              <LeadsStaffPage />
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/payers"
          element={
            <StaffProtectedRoute>
              <PayersStaffPage />
            </StaffProtectedRoute>
          }
        />
        <Route
          path="/staff/customers"
          element={
            <StaffProtectedRoute>
              <CustomersStaffPage />
            </StaffProtectedRoute>
          }
        />
      </Routes>
    </StaffAuthProvider>
  )
}
