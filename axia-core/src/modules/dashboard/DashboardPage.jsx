import { motion } from 'framer-motion'
import { DailySummary } from './panels/DailySummary'
import { CashFlowPanel } from './panels/CashFlowPanel'
import { ClientsMRR } from './panels/ClientsMRR'
import { PendingExpenses } from './panels/PendingExpenses'
import { AxiaPerformance } from './panels/AxiaPerformance'
import { AxiaDailySummary } from './panels/AxiaDailySummary'
import { getRegisteredModules } from '@/lib/engine/registry'
import { useModuleStore } from '@/store/useModuleStore'
import { Link } from 'react-router'
import { Sparkles, ArrowRight, Zap, Target, Plus } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }

export default function DashboardPage() {
  const registeredModules = getRegisteredModules()
  const { modulesData } = useModuleStore()

  return (
    <motion.div 
      variants={stagger} 
      initial="hidden" 
      animate="show" 
      className="space-y-8 pb-12"
    >
      {/* Premium Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-accent/20 text-accent text-[10px] font-black uppercase tracking-widest rounded-md border border-accent/30">
                 Axia OS v4.0
              </div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Master Command Center</span>
           </div>
           <h2 className="text-4xl font-black text-text tracking-tighter uppercase leading-none">Ejecucion Central</h2>
           <p className="text-text-muted mt-2 text-sm italic">Bienvenido, Miguel. Sincronizacion neuronal activa.</p>
        </div>
        
        <Link 
          to="/modules"
          className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-accent to-accent-hover text-white rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
        >
          <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Gestión de Clientes</p>
             <p className="text-sm font-bold">Selector de Módulos</p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* AXIA Daily Brief + Alertas Críticas */}
      <motion.div variants={fadeUp}>
        <AxiaDailySummary />
      </motion.div>

      {/* Main KPI Row */}
      <motion.div variants={fadeUp}>
        <DailySummary />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Financials */}
        <div className="lg:col-span-2 space-y-8">
           <motion.div variants={fadeUp}>
             <CashFlowPanel />
           </motion.div>
           <motion.div variants={fadeUp}>
             <AxiaPerformance />
           </motion.div>
        </div>

        {/* Right Column: Verticals Hub */}
        <div className="space-y-8">
           <motion.div 
             variants={fadeUp}
             className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden"
           >
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xs font-black text-text uppercase tracking-widest flex items-center gap-2">
                   <Target className="w-4 h-4 text-accent" />
                   Status de Verticales
                 </h3>
                 <span className="text-[10px] font-bold text-text-dim uppercase">{registeredModules.length} Activas</span>
              </div>
              
              <div className="space-y-3">
                 {registeredModules.map((m, i) => (
                   <Link 
                    key={m.id}
                    to={`/module/${m.id}`}
                    className="flex items-center justify-between p-4 bg-surface-2 border border-border rounded-2xl hover:border-accent/40 hover:bg-surface-3 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-surface-3 text-text-muted group-hover:text-accent transition-colors">
                            <m.icon className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-text uppercase tracking-tight">{m.name}</p>
                            <p className="text-[9px] text-text-dim font-bold uppercase">{m.sector}</p>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                          <div className={cn(
                             "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                             (modulesData[m.id]?.status === 'moroso' || modulesData[m.id]?.status === 'parcial') ? "bg-red-400/10 text-red-400 border-red-400/20" : 
                             modulesData[m.id]?.status === 'pago' ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" :
                             "bg-white/10 text-white/40 border-white/10"
                          )}>
                             {modulesData[m.id]?.status || 'nuevo'}
                          </div>
                          <Sparkles className="w-3 h-3 text-warning opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                   </Link>
                 ))}
                 
                 <Link 
                   to="/modules"
                   className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-2xl text-text-dim hover:text-accent hover:border-accent hover:bg-accent/5 transition-all mt-4"
                 >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Añadir Módulo</span>
                 </Link>
              </div>
           </motion.div>

           <motion.div variants={fadeUp}>
             <PendingExpenses />
           </motion.div>
        </div>
      </div>

      {/* Global Intelligence Bar */}
      <motion.div 
        variants={fadeUp}
        className="bg-gradient-to-r from-surface-2 to-surface border border-border p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Zap className="w-10 h-10 text-accent animate-pulse" />
           </div>
           <div>
              <h4 className="text-xl font-black text-text uppercase tracking-tighter">Motor de Crecimiento Activo</h4>
              <p className="text-sm text-text-muted mt-1 leading-relaxed max-w-md">
                 Axia ha detectado un potencial de automatizacion del 42% en el rubro logistico. 
                 Sugerimos desplegar el modulo de <strong>Tracking GPS</strong> para el proximo cliente.
              </p>
           </div>
        </div>
        <Link 
          to="/axia-analytics"
          className="px-8 py-4 bg-surface-3 border border-border text-text font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-surface-2 transition-all"
        >
           Ver Analítica AXIA
        </Link>
      </motion.div>
    </motion.div>
  )
}
