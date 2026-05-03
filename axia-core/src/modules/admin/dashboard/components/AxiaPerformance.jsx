import { motion } from 'framer-motion'
import { Zap, Shield, Cpu, Activity, AlertTriangle } from 'lucide-react'
import { useTenantStore } from '@/store/useTenantStore'
import { formatCurrency } from '@/lib/utils'

export const AxiaPerformance = () => {
  const { performance } = useTenantStore()
  
  const stats = [
    { label: 'Decisiones Hoy', value: performance.decisions, icon: Cpu, color: 'text-turquoise' },
    { label: 'Auto-Correcciones', value: performance.corrections, icon: Shield, color: 'text-white' },
    { label: 'Costo Ejecucion', value: formatCurrency(performance.cost), icon: Zap, color: 'text-turquoise' },
    { label: 'Calidad Sistema', value: `${performance.quality}%`, icon: Activity, color: 'text-white' },
  ]

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Activity className="w-4 h-4 text-turquoise" />
          Performance Axia
        </h3>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-bold text-green-500 uppercase">Sincronizado</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-turquoise/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
               <stat.icon className={`w-3 h-3 ${stat.color}`} />
               <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
            </div>
            <p className="text-lg font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-turquoise/10 border border-turquoise/20 rounded-2xl flex items-center gap-4">
        <AlertTriangle className="w-5 h-5 text-turquoise" />
        <div>
           <p className="text-[10px] font-black uppercase text-turquoise">Estado del Sistema</p>
           <p className="text-[11px] font-medium text-white/80">Cero alertas criticas. Red neuronal operando al 100% de capacidad.</p>
        </div>
      </div>
    </div>
  )
}
