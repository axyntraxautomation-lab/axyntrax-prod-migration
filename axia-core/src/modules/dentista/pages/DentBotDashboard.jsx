import { useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { BaseDashboardKPIs } from '@/components/base/BaseDashboardKPIs'
import { BaseCharts } from '@/components/base/BaseCharts'
import { Activity, Clipboard, CreditCard, Calendar } from 'lucide-react'

export default function DentBotDashboard() {
  const { config } = useOutletContext()
  
  const dentKpis = [
    { key: 'citas_hoy', label: 'Citas Hoy', icon: Calendar, color: config.primaryColor, value: 10 },
    { key: 'tratam_activos', label: 'Tratamientos', icon: Activity, color: '#10b981', value: 85 },
    { key: 'odontogramas', label: 'Odontogramas', icon: Clipboard, color: config.primaryColor, value: 420 },
    { key: 'cobros_pend', label: 'Por Cobrar', icon: CreditCard, color: '#ec4899', value: 'S/. 12,400', isCurrency: true },
  ]

  const chartData = [
    { name: 'Sem 1', value: 30 },
    { name: 'Sem 2', value: 45 },
    { name: 'Sem 3', value: 35 },
    { name: 'Sem 4', value: 60 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Métrica Odontológica</h2>
        <BaseDashboardKPIs kpis={dentKpis} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <BaseCharts data={chartData} primaryColor={config.primaryColor} />
        </div>
        <div className="bg-black border border-white/10 rounded-3xl p-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 font-mono">Pendientes de Pago</h3>
           <div className="space-y-4">
             {[
               { name: 'Sofia Vergara', task: 'Ortodoncia - Cuota 04', amount: '350.00' },
               { name: 'Carlos Slim', task: 'Implante - Fase 01', amount: '1,200.00' },
               { name: 'Elon Musk', task: 'Profilaxis', amount: '150.00' },
             ].map((p, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#ec4899]/30 transition-all">
                 <div>
                    <p className="text-xs font-bold text-white leading-none">{p.name}</p>
                    <p className="text-[9px] text-white/30 uppercase mt-1">{p.task}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-[#ec4899]">S/. {p.amount}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}
