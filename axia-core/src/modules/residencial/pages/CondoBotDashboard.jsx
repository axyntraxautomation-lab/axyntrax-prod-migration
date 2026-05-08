import { useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { BaseDashboardKPIs } from '@/components/base/BaseDashboardKPIs'
import { BaseCharts } from '@/components/base/BaseCharts'
import { Home, AlertCircle, Calendar, DollarSign } from 'lucide-react'

export default function CondoBotDashboard() {
  const { config } = useOutletContext()
  
  const condoKpis = [
    { key: 'morosos', label: 'Unidades Morosas', icon: AlertCircle, color: '#ef4444', value: 8 },
    { key: 'cuotas_mes', label: 'Cuotas Cobradas', icon: DollarSign, color: '#10b981', value: 'S/. 24,500' },
    { key: 'asambleas', label: 'Asambleas', icon: Calendar, color: config.primaryColor, value: 1 },
    { key: 'incidencias', label: 'Incidencias Libres', icon: Home, color: config.primaryColor, value: 5 },
  ]

  const chartData = [
    { name: 'Ene', value: 18000 },
    { name: 'Feb', value: 22000 },
    { name: 'Mar', value: 24500 },
    { name: 'Abr', value: 19000 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Estado del Condominio</h2>
        <BaseDashboardKPIs kpis={condoKpis} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <BaseCharts data={chartData} primaryColor={config.primaryColor} type="bar" />
        </div>
        <div className="bg-black border border-white/10 rounded-3xl p-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 font-mono">Ultimas Incidencias</h3>
           <div className="space-y-4">
             {[
               { id: 'INC-201', desc: 'Filtro Piscina Obstruido', status: 'Cerrado' },
               { id: 'INC-205', desc: 'Luz Ascensor B fundida', status: 'Abierto' },
               { id: 'INC-210', desc: 'Fuga Agua Sotano 2', status: 'Abierto' },
             ].map((inc, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#3b82f6]/30 transition-all">
                 <div>
                    <p className="text-xs font-bold text-white leading-none">{inc.desc}</p>
                    <p className="text-[9px] text-white/30 uppercase mt-1">{inc.id}</p>
                 </div>
                 <span className={cn(
                   "text-[8px] font-black uppercase px-2 py-1 rounded-md",
                   inc.status === 'Abierto' ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                 )}>
                   {inc.status}
                 </span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
