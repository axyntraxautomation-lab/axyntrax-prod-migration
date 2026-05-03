import { useState } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronRight, Search, Bell, Bot } from 'lucide-react'
import { getModuleConfig } from '@/lib/engine/registry'
import { cn } from '@/lib/utils'

export default function BaseModuleLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { moduleId } = useParams()
  const location = useLocation()
  
  const config = getModuleConfig(moduleId) || getModuleConfig('medico')
  if (!config) return <div className="p-20 text-center uppercase font-black text-white/20">Cargando Modulo...</div>
  const Icon = config.icon || Bot

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar de Modulo */}
      <aside className={cn(
        "bg-black border-r border-white/5 transition-all duration-300 relative z-50",
        isSidebarOpen ? "w-64" : "w-0"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 flex items-center gap-4">
             <div className="p-2 rounded-xl" style={{ backgroundColor: `${config.primaryColor}20`, color: config.primaryColor }}>
                <Icon className="w-6 h-6" />
             </div>
             <div className="overflow-hidden">
                <h2 className="text-sm font-black uppercase tracking-tighter truncate">{config.name}</h2>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">{config.sector}</p>
             </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1">
             {config.sections.map((section) => {
               const fullPath = `/module/${moduleId}${section.path}`
               const isActive = location.pathname === fullPath
               return (
                 <Link
                   key={section.label}
                   to={fullPath}
                   className={cn(
                     "flex items-center gap-4 p-3 rounded-2xl transition-all group",
                     isActive ? "bg-white/5 text-white" : "text-white/40 hover:text-white"
                   )}
                 >
                    <section.icon className={cn("w-4 h-4", isActive && "text-white")} style={{ color: isActive ? config.primaryColor : undefined }} />
                    <span className="text-[11px] font-bold uppercase tracking-tight">{section.label}</span>
                 </Link>
               )
             })}
          </nav>

          <Link to="/admin" className="p-6 border-t border-white/5 flex items-center gap-3 text-white/30 hover:text-white transition-colors">
             <Bot className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Master Center</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg">
                <Menu className="w-5 h-5 text-white/40" />
             </button>
             <div className="h-6 w-px bg-white/10 mx-2" />
             <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Operacion {config.name}</h3>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <Search className="w-4 h-4 text-white/20" />
                <input className="bg-transparent border-none outline-none text-[10px] uppercase font-bold text-white placeholder:text-white/20" placeholder="Buscar registros..." />
             </div>
             <button className="relative">
                <Bell className="w-5 h-5 text-white/30" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
             </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
           <Outlet context={{ config }} />
        </div>
      </div>
    </div>
  )
}
