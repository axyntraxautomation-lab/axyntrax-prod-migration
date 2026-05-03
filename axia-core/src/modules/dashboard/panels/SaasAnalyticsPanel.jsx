import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Target, BarChart3, Clock, ShieldCheck, Heart 
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

export function SaasAnalyticsPanel({ metrics }) {
  const items = [
    { label: 'MRR', value: formatCurrency(metrics.mrr), detail: 'Ingreso Mensual Recurrente', icon: DollarSign, color: 'text-accent' },
    { label: 'ARR', value: formatCurrency(metrics.arr), detail: 'Ingreso Anual Proyectado', icon: TrendingUp, color: 'text-success' },
    { label: 'CHURN', value: `${metrics.churnRate.toFixed(1)}%`, detail: 'Tasa de Cancelación', icon: TrendingDown, color: 'text-red-400' },
    { label: 'NRR / GRR', value: `${metrics.nrr.toFixed(0)}% / ${metrics.grr.toFixed(0)}%`, detail: 'Retención de Ingresos', icon: BarChart3, color: 'text-indigo-400' },
    { label: 'CAC', value: formatCurrency(metrics.cac), detail: 'Costo Adquisición Cliente', icon: Target, color: 'text-orange-400' },
    { label: 'LTV', value: formatCurrency(metrics.ltv), detail: 'Valor de Vida del Cliente', icon: Heart, color: 'text-pink-400' },
    { label: 'PAYBACK', value: `${metrics.payback.toFixed(1)}m`, detail: 'Meses Recuperación CAC', icon: Clock, color: 'text-yellow-400' },
    { label: 'HEALTH', value: `${metrics.health.toFixed(1)}%`, detail: 'Salud del Ecosistema', icon: ShieldCheck, color: metrics.health > 80 ? 'text-success' : 'text-warning' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 transition-all group"
          >
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">{item.label}</span>
                <div className="p-2 rounded-lg bg-surface-2 group-hover:scale-110 transition-transform">
                   <item.icon className={cn("w-4 h-4", item.color)} />
                </div>
             </div>
             <p className="text-xl font-bold text-text mb-1">{item.value}</p>
             <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{item.detail}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Ecosystem Health Progress */}
      <div className="bg-surface border border-border rounded-2xl p-6">
         <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-text uppercase tracking-widest">Saturación y Salud Operativa</h4>
            <span className="text-xs font-black text-text">{metrics.health.toFixed(1)}%</span>
         </div>
         <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${metrics.health}%` }}
              className={cn("h-full transition-all duration-1000", metrics.health > 80 ? "bg-success" : "bg-warning")} 
            />
         </div>
      </div>
    </div>
  )
}
