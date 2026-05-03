import { useOutletContext } from 'react-router'
import { motion } from 'framer-motion'
import { BaseDashboardKPIs } from '@/components/base/BaseDashboardKPIs'
import { BaseCharts } from '@/components/base/BaseCharts'
import { Calendar, Users, XCircle, Clock } from 'lucide-react'

export default function MediBotDashboard() {
  const { config } = useOutletContext()
  
  const medKpis = [
    { key: 'citas_hoy', label: 'Citas del Día', icon: Calendar, color: config.primaryColor, value: 12 },
    { key: 'pacientes_nuevos', label: 'Pacientes Nuevos', icon: Users, color: '#10b981', value: 3 },
    { key: 'cancelaciones', label: 'Cancelaciones', icon: XCircle, color: '#ef4444', value: 1 },
    { key: 'proxima_libre', label: 'Proxima Hora Libre', icon: Clock, color: config.primaryColor, value: '11:30 AM' },
  ]

  const chartData = [
    { name: '08:00', value: 2 },
    { name: '10:00', value: 5 },
    { name: '12:00', value: 3 },
    { name: '14:00', value: 4 },
    { name: '16:00', value: 8 },
    { name: '18:00', value: 2 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Ejecución Médica</h2>
        <BaseDashboardKPIs kpis={medKpis} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <BaseCharts data={chartData} primaryColor={config.primaryColor} />
        </div>
        <div className="bg-black border border-white/10 rounded-3xl p-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 font-mono">Próximos en Agenda</h3>
           <div className="space-y-4">
             {[
               { time: '11:30', name: 'Alvaro Sanchez', type: 'Consulta General' },
               { time: '12:00', name: 'Maria Loayza', type: 'Pediatria' },
               { time: '12:30', name: 'Jorge Perez', type: 'Traumatologia' },
             ].map((cita, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 font-mono">{cita.time}</span>
                    <div>
                       <p className="text-xs font-bold text-white leading-none">{cita.name}</p>
                       <p className="text-[9px] text-white/30 uppercase mt-1">{cita.type}</p>
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
