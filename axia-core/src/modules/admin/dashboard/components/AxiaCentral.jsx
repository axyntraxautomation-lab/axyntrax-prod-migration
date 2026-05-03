import { motion } from 'framer-motion'
import { Activity, Bell, Target, Cpu, ShieldCheck, Zap } from 'lucide-react'
import { useAxiaStore } from '@/store/useAxiaStore'
import { formatCurrency } from '@/lib/utils'

export const AxiaCentral = () => {
  const { alerts, recommendations, metrics } = useAxiaStore()
  
  const stats = [
    { label: 'Decisiones Hoy', value: metrics.decisionsToday, icon: Target, color: 'text-turquoise' },
    { label: 'Auto-Correcciones', value: metrics.autoCorrections, icon: ShieldCheck, color: 'text-white' },
    { label: 'Calidad Sistema', value: `${metrics.systemQuality}%`, icon: Activity, color: 'text-turquoise' },
    { label: 'Costo Ejecucion', value: formatCurrency(metrics.operationalCost), icon: Zap, color: 'text-white' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna Izquierda: Status & Metricas */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-black border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-turquoise" />
              Estado Central del Motor Axia
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-turquoise animate-pulse" />
              <span className="text-[10px] font-black text-turquoise uppercase">IA Sincronizada</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-turquoise/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  <span className="text-[9px] font-black uppercase text-white/40">{stat.label}</span>
                </div>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones Proactivas */}
        <div className="bg-black border border-white/10 rounded-3xl p-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 font-mono">Recomendaciones de Optimización</h3>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="p-4 bg-turquoise/5 border border-turquoise/20 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-turquoise/10 rounded-lg text-turquoise">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-1">{rec.title || 'Mejora Detectada'}</p>
                  <p className="text-[11px] text-white/60 leading-relaxed">{rec.description}</p>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-center py-6 text-xs italic text-white/20">Esperando nuevos patrones de ejecución...</p>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Alertas Criticas */}
      <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-8 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Alertas del Sistema
        </h3>
        <div className="space-y-4">
          {alerts.filter(a => !a.dismissed).map((alert, i) => (
            <motion.div 
              key={alert.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase text-red-400">Prioridad Alta</span>
                <span className="text-[8px] text-white/30 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs font-bold text-white mb-1">{alert.title}</p>
              <p className="text-[10px] text-white/60">{alert.message}</p>
            </motion.div>
          ))}
          {alerts.filter(a => !a.dismissed).length === 0 && (
             <div className="text-center py-12">
                <ShieldCheck className="w-8 h-8 text-turquoise/20 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Operación Segura</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
