import { useOutletContext } from 'react-router'
import { BaseAxiaChat } from '@/components/base/BaseAxiaChat'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Briefcase, BarChart3, Activity } from 'lucide-react'

export default function AxiaDent() {
  const { config } = useOutletContext()

  const insights = [
    { 
      label: 'Seguimiento de Pagos', 
      desc: 'Detectados 3 pacientes con cuotas de ortodoncia vencidas por más de 5 días.', 
      icon: AlertTriangle, 
      color: 'text-[#ec4899]' 
    },
    { 
      label: 'Tratamientos Críticos', 
      desc: 'El 15% de los implantes están próximos a la fase de coronación. Sugerido agendar.', 
      icon: Activity, 
      color: 'text-green-500' 
    },
    { 
      label: 'SUNAT Facturación', 
      desc: 'Sincronización mensual completa. No hay boletas pendientes de envío.', 
      icon: Briefcase, 
      color: 'text-white' 
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
             <Activity className="w-5 h-5 text-[#ec4899]" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Asistente Axia Dent</h2>
          </div>
          <BaseAxiaChat config={config} />
       </div>

       <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Monitor Clínico</h3>
          {insights.map((ins, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-6 bg-black border border-white/10 rounded-3xl group hover:border-[#ec4899]/20 transition-all cursor-crosshair"
             >
                <div className="flex items-center gap-3 mb-4">
                   <ins.icon className={cn("w-4 h-4", ins.color)} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">{ins.label}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed uppercase font-bold group-hover:text-white/60 transition-colors">
                   {ins.desc}
                </p>
             </motion.div>
          ))}

          <div className="p-6 bg-[#ec4899]/5 border border-[#ec4899]/20 rounded-3xl">
             <div className="flex items-center gap-3 mb-2 text-[#ec4899]">
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Analitica de Crecimiento</span>
             </div>
             <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase italic">
                "La especialidad de Endodoncia ha subido un 12%. Sugerimos invertir en stock de limas rotatorias."
             </p>
          </div>
       </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
