import { useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { BaseDashboardKPIs } from '@/components/base/BaseDashboardKPIs'
import { BaseCharts } from '@/components/base/BaseCharts'
import { Briefcase, Gavel, FileText, Users } from 'lucide-react'

export default function LexBotDashboard() {
  const { config } = useOutletContext()
  
  const lexKpis = [
    { key: 'exp_activos', label: 'Expedientes', icon: Briefcase, color: config.primaryColor, value: 45 },
    { key: 'audiencias', label: 'Audiencias Hoy', icon: Gavel, color: '#10b981', value: 3 },
    { key: 'docs_pend', label: 'Docs Pendientes', icon: FileText, color: '#f59e0b', value: 12 },
    { key: 'clientes_nuevos', label: 'Clientes Nuevos', icon: Users, color: config.primaryColor, value: 8 },
  ]

  const chartData = [
    { name: 'Ene', value: 10 },
    { name: 'Feb', value: 25 },
    { name: 'Mar', value: 20 },
    { name: 'Abr', value: 45 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Métrica Jurídica</h2>
        <BaseDashboardKPIs kpis={lexKpis} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <BaseCharts data={chartData} primaryColor={config.primaryColor} type="area" />
        </div>
        <div className="bg-black border border-white/10 rounded-3xl p-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 font-mono">Audiencias del Día</h3>
           <div className="space-y-4">
             {[
               { time: '10:00', case: '00124-2026', type: 'Vista de Causa' },
               { time: '12:30', case: '00542-2025', type: 'Audiencia de Pruebas' },
               { time: '15:20', case: '00981-2026', type: 'Declaracion' },
             ].map((a, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#ef4444]/30 transition-all">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 font-mono">{a.time}</span>
                    <div>
                       <p className="text-xs font-bold text-white leading-none">{a.case}</p>
                       <p className="text-[9px] text-white/30 uppercase mt-1">{a.type}</p>
                    </div>
                 </div>
                 <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.primaryColor }} />
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}
