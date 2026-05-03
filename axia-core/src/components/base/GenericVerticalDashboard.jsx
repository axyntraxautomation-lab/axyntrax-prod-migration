import { useOutletContext } from 'react-router'
import BaseDashboardKPIs from '@/components/base/BaseDashboardKPIs'
import BaseAxiaChat from '@/components/base/BaseAxiaChat'
import BaseCharts from '@/components/base/BaseCharts'
import { BaseSkeleton } from '@/components/base/BaseSkeletons'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useModuleStore } from '@/store/useModuleStore'
import { 
  Play, CheckCircle2, AlertCircle, Clock, 
  CreditCard, Sparkles, ShieldAlert, ArrowUpRight 
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

/**
 * Universal Dashboard for any vertical module registered in the engine.
 * Enhanced with Business Simulation Engine for Lifecycle Testing.
 */
export default function GenericVerticalDashboard() {
  const { config } = useOutletContext()
  const { isPremium } = useAuthStore()
  const { recordModuleTransaction } = useFinanceStore()
  const { getModuleData, setModuleStatus } = useModuleStore()
  
  const moduleData = getModuleData(config.id)
  const currentStatus = moduleData.status || 'nuevo'
  const isPro = isPremium()

  const STATES = [
    { id: 'nuevo', label: 'Nuevo', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'prueba', label: 'En Prueba', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'pago', label: 'Pagado', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'parcial', label: 'Pago Parcial', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { id: 'moroso', label: 'Moroso', color: 'text-red-400', bg: 'bg-red-400/10' },
    { id: 'renovacion', label: 'Renovación', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ]

  const VERTICAL_ACTIONS = {
    medico: [
      { label: 'Agendar Paciente', event: 'Consulta General', price: 150 },
      { label: 'Emitir Receta', event: 'Venta de Insumos', price: 45 },
      { label: 'Cirugía Programada', event: 'Procedimiento Alta Complejidad', price: 3500 },
    ],
    legal: [
      { label: 'Apertura de Expediente', event: 'Gastos Administrativos', price: 200 },
      { label: 'Asesoría VIP', event: 'Honorarios por hora', price: 450 },
      { label: 'Cierre de Caso', event: 'Bono por Éxito', price: 1500 },
    ],
    dental: [
      { label: 'Profilaxis', event: 'Atención Preventiva', price: 120 },
      { label: 'Instalar Brackets', event: 'Ortodoncia Fase 1', price: 800 },
    ],
    residencial: [
      { label: 'Recaudar Mantenimiento', event: 'Pago Cuota Ordinaria', price: 350 },
      { label: 'Reserva de Parrilla', event: 'Uso de Áreas Comunes', price: 50 },
    ],
    veterinario: [
      { label: 'Vacunación', event: 'Medicina Preventiva', price: 85 },
      { label: 'Baño y Corte', event: 'Servicio Grooming', price: 60 },
    ],
    logistico: [
      { label: 'Despacho de Carga', event: 'Flete Interprovincial', price: 1200 },
      { label: 'Mantenimiento Flota', event: 'Gasto Operativo', price: -450 },
    ],
  }

  const actions = VERTICAL_ACTIONS[config.id] || VERTICAL_ACTIONS.medico

  const handleSimulateAction = (action) => {
    const amount = action ? action.price : (Math.floor(Math.random() * 1050) + 150)
    const label = action ? action.event : `Operación en ${config.name}`
    
    recordModuleTransaction(config.id, amount, `[IA SIM] ${label}`)
    alert(`Evento: ${label}\nMonto: S/ ${amount}\nEstado: Sincronizado con Master Dashboard`)
  }

  // Dynamic Mock Data generator based on module KPIs
  const mockData = config.kpis.reduce((acc, kpi) => {
    acc[kpi.key] = kpi.isCurrency ? (Math.random() * 5000 + 1000) : (Math.floor(Math.random() * 50) + 5)
    return acc
  }, {})

  const chartData = [
    { name: 'Lun', value: Math.random() * 500 },
    { name: 'Mar', value: Math.random() * 500 },
    { name: 'Mie', value: Math.random() * 500 },
    { name: 'Jue', value: Math.random() * 500 },
    { name: 'Vie', value: Math.random() * 500 },
  ]

  return (
    <div className="relative space-y-6">
      {/* Simulation Engine Control Bar */}
      <div className="bg-surface-2 border border-white/5 rounded-2xl p-2 flex items-center justify-between mb-8 overflow-x-auto no-scrollbar">
         <div className="flex items-center gap-2 px-4 border-r border-white/5">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted whitespace-nowrap">SIMULADOR AXIA</span>
         </div>
         <div className="flex gap-2 p-1">
            {STATES.map(s => (
              <button
                key={s.id}
                onClick={() => setModuleStatus(config.id, s.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                  currentStatus === s.id ? `${s.bg} ${s.color} border border-white/10` : "text-white/20 hover:text-white/40 hover:bg-white/5"
                )}
              >
                {s.label}
              </button>
            ))}
         </div>
      </div>

      {/* Lifecycle Status Overlays */}
      <AnimatePresence mode="wait">
        {currentStatus === 'moroso' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-red-500/20 border border-red-500/40 rounded-3xl flex items-center justify-between gap-6"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/30">
                   <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-tight">ALERTA: ESTADO MOROSO DETECTADO</h4>
                   <p className="text-xs text-red-200 mt-1 uppercase font-bold tracking-widest">Axia ha restringido ciertas funciones de este modulo.</p>
                </div>
             </div>
             <button className="px-6 py-3 bg-white text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Regularizar Deuda</button>
          </motion.div>
        )}

        {currentStatus === 'prueba' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-accent/20 border border-accent/40 rounded-3xl flex items-center justify-between gap-6"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 bg-accent rounded-2xl shadow-lg shadow-accent/30">
                   <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-tight">VERSION DE PRUEBA ACTIVA</h4>
                   <p className="text-xs text-accent mt-1 uppercase font-bold tracking-widest">Quedan 10 dias para el despliegue final en este tenant.</p>
                </div>
             </div>
             <button className="px-6 py-3 bg-white text-accent rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Activar Licencia Pro</button>
          </motion.div>
        )}

        {currentStatus === 'renovacion' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-indigo-500/20 border border-indigo-500/40 rounded-3xl flex items-center justify-between gap-6"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                   <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-tight">RENOVACION PENDIENTE</h4>
                   <p className="text-xs text-indigo-200 mt-1 uppercase font-bold tracking-widest">Su ciclo de facturacion cierra en 48 horas.</p>
                </div>
             </div>
             <button className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Renovar Suscripción</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. KPIs Section */}
      <BaseDashboardKPIs kpis={config.kpis} data={mockData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Main Chart Section */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-xs font-black text-text uppercase tracking-widest">Analisis de Rendimiento</h3>
                <p className="text-[10px] text-text-dim mt-1">Metricas de la ultima semana laboral</p>
             </div>
             <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.primaryColor }} />
                <span className="text-[10px] font-bold text-text-dim uppercase">En Vivo</span>
             </div>
          </div>
          <BaseCharts data={chartData} color={config.primaryColor} isCurrency={true} />
        </div>

        {/* 3. Domain Info Widget */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
           <h3 className="text-xs font-bold text-text uppercase tracking-widest">Estado del Modulo</h3>
           <div className="space-y-4">
             <div className="p-4 bg-surface-2 rounded-xl border border-border flex justify-between items-center group hover:border-border-hover transition-colors">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Operatividad</span>
                <span className="text-xs font-black text-success uppercase">100% Online</span>
             </div>
             <div className="p-4 bg-surface-2 rounded-xl border border-border flex justify-between items-center group hover:border-border-hover transition-colors">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Sincro Axia</span>
                <span className="text-xs font-black text-accent uppercase">Activo</span>
             </div>
             
             {/* Dynamic Status Pill */}
             <div className={cn(
               "p-4 rounded-xl border flex justify-between items-center",
               currentStatus === 'moroso' ? "bg-red-500/10 border-red-500/20" : "bg-surface-2 border-border"
             )}>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Licencia</span>
                <span className={cn("text-xs font-black uppercase", 
                  currentStatus === 'moroso' ? "text-red-500" : 
                  currentStatus === 'pago' ? "text-success" : 
                  "text-warning"
                )}>
                  {currentStatus}
                </span>
             </div>

             <div className="pt-4 mt-4 border-t border-border space-y-4">
                <p className="text-[10px] text-text-dim italic leading-relaxed">
                  Este panel se adapta automaticamente al rubro <strong>{config.sector}</strong>. 
                  Todos los submódulos seleccionados en el configurador están activos para este tenant.
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {actions.map((act, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSimulateAction(act)}
                      className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-tight transition-all"
                    >
                       {act.label}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleSimulateAction()}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-2"
                >
                   <Play className="w-3.5 h-3.5 fill-current" />
                   Ejecución Aleatoria
                </button>
             </div>
           </div>
        </div>
      </div>

      {/* 4. Axia Intelligence Section */}
      <BaseAxiaChat 
        config={config} 
        recommendations={config.axiaRecommendations || [
          { type: 'Axia Tip', text: `Optimizando procesos para el rubro ${config.name}...` },
          { type: 'Status', text: `Estado actual: ${currentStatus.toUpperCase()}` }
        ]} 
      />
    </div>
  )
}
