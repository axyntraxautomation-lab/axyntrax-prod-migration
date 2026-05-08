import { BrowserRouter, Routes, Route } from 'react-router'
import { ErrorBoundary } from './ErrorBoundary'
import NosotrosPage from '@/modules/empresa/NosotrosPage'
import BlogPage from '@/modules/empresa/BlogPage'
import PartnersPage from '@/modules/empresa/PartnersPage'
import ContactoPage from '@/modules/empresa/ContactoPage'
import SunatHomologacionPage from '@/modules/legal/SunatHomologacionPage'
import CentroAyudaPage from '@/modules/ayuda/CentroAyudaPage'
import { ProtectedRoute } from './ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'

// Lazy load modules (optional, but good for structure)
import DashboardPage from '@/modules/dashboard/DashboardPage'
import FinancePage from '@/modules/finance/FinancePage'
import SunatPage from '@/modules/sunat/SunatPage'
import SalaryPage from '@/modules/salary/SalaryPage'
import ExpensesPage from '@/modules/expenses/ExpensesPage'
import AxiaCentralPage from '@/modules/axia/AxiaCentralPage'
import ReportsPage from '@/modules/reports/ReportsPage'
import RestaurantDashboard from '@/modules/restaurant/pages/RestaurantDashboard'
import BaseModuleLayout from '@/components/base/BaseModuleLayout'
import GenericVerticalDashboard from '@/components/base/GenericVerticalDashboard'
import ConfiguratorPage from '@/modules/configurator/ConfiguratorPage'
import LandingPage from '@/modules/landing/LandingPage'
import PricingPage from '@/modules/pricing/PricingPage'
import AdminPage from '@/modules/admin/AdminPage'
import TerminosPage from '@/modules/legal/TerminosPage'
import PrivacidadPage from '@/modules/legal/PrivacidadPage'
import ModuleSelectorPage from '@/modules/dashboard/ModuleSelectorPage'
import AxiaDashboardPage from '@/modules/dashboard/AxiaDashboardPage'
import '@/modules/clinica/ClinicaConfig' // Register demo
import '@/lib/engine/verticals' // Register Phase 4 verticals

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="configurator" element={<ConfiguratorPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="restaurant/*" element={<RestaurantDashboard />} />
            <Route path="module/:moduleId" element={<BaseModuleLayout />}>
              <Route index element={<GenericVerticalDashboard />} />
              {/* Vertical sub-routes are handled by the generic dashboard */}
            </Route>
            <Route path="sunat" element={<SunatPage />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="axia" element={<AxiaCentralPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="modules" element={<ModuleSelectorPage />} />
            <Route path="axia-analytics" element={<AxiaDashboardPage />} />
          </Route>

          <Route path="landing" element={<LandingPage />} />
          <Route index element={<LandingPage />} />
          <Route path="terminos" element={<TerminosPage />} />
          <Route path="privacidad" element={<PrivacidadPage />} />
          <Route path="nosotros" element={<NosotrosPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="contacto" element={<ContactoPage />} />
          <Route path="sunat-homologacion" element={<SunatHomologacionPage />} />
          <Route path="ayuda" element={<CentroAyudaPage />} />
          
          {/* Fallback for 404s */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text">
              <h1 className="text-4xl font-black text-accent-hover tracking-tighter">404</h1>
              <p className="text-text-muted mt-2">Pagina no encontrada</p>
              <a href="/" className="mt-6 text-accent underline text-sm">Volver al inicio</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
