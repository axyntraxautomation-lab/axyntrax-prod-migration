import { Routes, Route, Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { Utensils, Map as MapIcon, ClipboardList, Wallet, Package, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

// Sub-pages (implemented next)
import TableMap from './TableMap'
import SalesList from './SalesList'
import CashClosure from './CashClosure'
import StockControl from './StockControl'
import RestaurantOverview from '../panels/RestaurantOverview'

const SUB_NAV = [
  { path: '', label: 'General', icon: Utensils },
  { path: 'map', label: 'Mapa de Mesas', icon: MapIcon },
  { path: 'sales', label: 'Ventas POS', icon: ClipboardList },
  { path: 'cashier', label: 'Cierre de Caja', icon: Wallet },
  { path: 'stock', label: 'Control Stock', icon: Package },
]

export default function RestaurantDashboard() {
  const location = useLocation()
  const basePath = '/restaurant'
  const currentPath = location.pathname.replace(basePath, '').replace(/^\//, '')

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Utensils className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Modulo Restaurante</h2>
            <p className="text-xs text-text-muted">Gestion operativa de salon, ventas y almacen</p>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <nav className="flex p-1 bg-surface-2 border border-border rounded-xl">
          {SUB_NAV.map((item) => {
            const isActive = currentPath === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path || '.'}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative',
                  isActive ? 'text-white' : 'text-text-dim hover:text-text'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn('w-4 h-4 relative z-10', isActive && 'text-white')} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="min-h-[calc(100vh-220px)]">
        <Routes>
          <Route index element={<RestaurantOverview />} />
          <Route path="map" element={<TableMap />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="cashier" element={<CashClosure />} />
          <Route path="stock" element={<StockControl />} />
        </Routes>
      </div>
    </div>
  )
}
