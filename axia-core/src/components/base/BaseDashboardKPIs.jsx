import { motion } from 'framer-motion'
import { TrendingUp, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BaseDashboardKPIs({ kpis = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-black border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
              <kpi.icon className="w-5 h-5 shadow-lg" style={{ color: kpi.color }} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-turquoise">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-white tracking-tighter">
                {kpi.isCurrency ? `S/. ${kpi.value || '0.00'}` : (kpi.value || '0')}
              </h4>
              <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
