import { NavLink, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, DollarSign, FileText, Wallet, Receipt,
  Brain, BarChart3, ChevronLeft, ChevronRight, UtensilsCrossed,
  Package, Boxes, Shield, Tag
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getRegisteredModules } from '@/lib/engine/registry'

const CORE_NAV = [
  { path: '/dashboard', label: 'Dashboard Maestro', icon: LayoutDashboard },
  { path: '/modules', label: 'Selector de Módulos', icon: Boxes },
  { path: '/axia-analytics', label: 'AXIA Analytics', icon: BarChart3 },
  { path: '/finance', label: 'Finanzas Hub', icon: DollarSign },
]

const TOOLS_NAV = [
  { path: '/sunat', label: 'SUNAT / Facturación', icon: FileText },
  { path: '/salary', label: 'Nómina / Sueldo', icon: Wallet },
  { path: '/expenses', label: 'Gastos de Empresa', icon: Receipt },
  { path: '/restaurant', label: 'Restaurante POS', icon: UtensilsCrossed },
  { path: '/axia', label: 'AXIA Intelligence', icon: Brain },
  { path: '/admin', label: 'Panel de Control', icon: Shield },
]

function NavItem({ item, isCollapsed }) {
  const location = useLocation()
  const isActive = location.pathname === item.path
  const Icon = item.icon
  
  return (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative',
        isActive
          ? 'bg-accent/10 text-accent font-bold'
          : 'text-text-muted hover:text-text hover:bg-surface-2'
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-accent')} />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
      {isActive && !isCollapsed && (
        <motion.div
          layoutId="nav-indicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
        />
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'h-screen bg-surface border-r border-border transition-all duration-300 flex flex-col sticky top-0 z-40',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Branding */}
      <div className="p-6 flex items-center justify-between border-b border-border bg-surface-2/20">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-white font-black text-xl tracking-tighter italic">A</span>
            </div>
            <div className="flex flex-col -gap-1">
              <span className="font-black text-text tracking-tighter text-base uppercase leading-none">AxyntraX</span>
              <span className="font-bold text-text-dim tracking-[0.2em] text-[8px] uppercase">Automation</span>
            </div>
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-surface-2 rounded-lg text-text-muted transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
        {/* Core Sections */}
        <div className="space-y-1">
          {CORE_NAV.map((item) => (
            <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>

        {/* Dynamic Vertical Modules */}
        {!isCollapsed && getRegisteredModules().length > 0 && (
          <div className="px-3">
             <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-4">Verticales</p>
             <div className="space-y-1">
               {getRegisteredModules().map((m) => (
                 <NavItem 
                    key={m.id} 
                    item={{ 
                      path: `/module/${m.id}`, 
                      label: m.name, 
                      icon: m.icon 
                    }} 
                    isCollapsed={isCollapsed} 
                  />
               ))}
             </div>
          </div>
        )}

        {/* Tools & Settings */}
        <div className="space-y-1 border-t border-border pt-6">
          {!isCollapsed && <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-4 px-3">Herramientas</p>}
          {TOOLS_NAV.map((item) => (
            <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>

      {/* Admin Quick Action */}
      <div className="p-4 border-t border-border bg-surface-2/10">
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10',
            isCollapsed && 'justify-center'
          )}>
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
             {!isCollapsed && <span className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Master Admin</span>}
          </div>
      </div>
    </div>
  )
}
