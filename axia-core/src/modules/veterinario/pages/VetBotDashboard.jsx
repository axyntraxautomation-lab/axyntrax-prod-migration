import { useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { BaseDashboardKPIs } from '@/components/base/BaseDashboardKPIs'
import { BaseCharts } from '@/components/base/BaseCharts'
import { Dog, Activity, Clipboard, Clock } from 'lucide-react'

export default function VetBotDashboard() {
  const { config } = useOutletContext()
  
  const vetKpis = [
    { key: 'consultas_hoy', label: 'Consultas Hoy', icon: Activity, color: config.primaryColor, value: 8 },
    { key: 'vacunas_prog', label: 'Vacunas Prog.', icon: Clock, color: '#10b981', value: 15 },
    { key: 'historias_abiertas', label: 'Historias Abiertas', icon: Clipboard, color: config.primaryColor, value: 120 },
    { key: 'proxima_cita', label: 'Proxima Cita', icon: Dog, color: config.primaryColor, value: '14:30 - "Toby"' },
  ]

  const chartData = [
    { name: 'Lun', value: 20 },
    { name: 'Mar', value: 35 },
    { name: 'Mie', value: 45 },
    { name: 'Jue', value: 30 },
    { name: 'Vie', value: 50 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Operación Veterinaria</h2>
        <BaseDashboardKPIs kpis={vetKpis} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <BaseCharts data={chartData} primaryColor={config.primaryColor} type="bar" />
        </div>
        <div className="bg-black border border-white/10 rounded-3xl p-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 font-mono">Vacunas del Dia</h3>
           <div className="space-y-4">
             {[
               { time: '14:30', pet: 'Toby', type: 'Antirrábica' },
               { time: '15:15', pet: 'Luna', type: 'Quintuple' },
               { time: '16:00', pet: 'Simba', type: 'Desparasitación' },
             ].map((v, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 font-mono">{v.time}</span>
                    <div>
                       <p className="text-xs font-bold text-white leading-none">{v.pet}</p>
                       <p className="text-[9px] text-white/30 uppercase mt-1">{v.type}</p>
                    </div>
                 </div>
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.primaryColor }} />
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}
