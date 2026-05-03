import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Activity, 
  Menu, 
  X, 
  Shield, 
  Settings,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Clientes', path: '/admin/clients', icon: Users },
    { name: 'Finanzas', path: '/admin/finance', icon: Wallet },
    { name: 'Performance', path: '/admin/performance', icon: Activity },
    { name: 'Seguridad', path: '/admin/security', icon: Shield },
    { name: 'Configuración', path: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-turquoise/30">
      {/* Sidebar Desktop */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-black border-r border-white/5 transition-all duration-500 z-50 overflow-hidden",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-turquoise rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-turquoise/20">
              <Shield className="w-6 h-6 text-black" />
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-sm font-black uppercase tracking-tighter leading-none">AxyntraX</h1>
                <p className="text-[10px] font-bold text-turquoise uppercase tracking-widest">Automation</p>
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-2xl transition-all group relative",
                    isActive ? "bg-turquoise/10 text-turquoise" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-turquoise" : "group-hover:text-white")} />
                  {isSidebarOpen && (
                    <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                  )}
                  {isActive && <motion.div layoutId="active" className="absolute left-0 w-1 h-6 bg-turquoise rounded-r-full" />}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-6 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">Miguel Montero</p>
                  <p className="text-[10px] text-turquoise font-black uppercase">Admin Master</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "transition-all duration-500",
        isSidebarOpen ? "pl-64" : "pl-20"
      )}>
        {/* Top Header */}
        <header className="h-20 bg-black/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-xl border border-white/5 w-64 group focus-within:border-turquoise/50 transition-all">
              <Search className="w-4 h-4 text-white/30 group-focus-within:text-turquoise" />
              <input 
                type="text" 
                placeholder="Buscar en el motor Axia..." 
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 relative hover:bg-white/5 rounded-xl transition-colors text-white/40">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-turquoise rounded-full border-2 border-black" />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button className="px-4 py-2 font-black text-[10px] uppercase tracking-widest text-turquoise border border-turquoise/30 rounded-xl hover:bg-turquoise/10 transition-all">
              Modo Live
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
