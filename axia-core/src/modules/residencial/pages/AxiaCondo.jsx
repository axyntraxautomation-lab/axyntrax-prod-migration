import { useOutletContext } from 'react-router'
import { BaseAxiaChat } from '@/components/base/BaseAxiaChat'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, Home, Calendar, ShieldCheck } from 'lucide-react'

export default function AxiaCondo() {
  const { config } = useOutletContext()

  const insights = [
    { 
      label: 'Morosidad Crítica', 
      desc: 'La recaudación este mes es un 12% menor a lo proyectado. 3 unidades han superado los 3 meses de deuda.', 
      icon: AlertCircle, 
      color: 'text-red-500' 
    },
    { 
      label: 'Infraestructura', 
      desc: 'Detectado incremento en incidencias de fontanería en Torre B. Sugiero revisión preventiva del tanque elevado.', 
      icon: Home, 
      color: 'text-[#3b82f6]' 
    },
    { 
      label: 'SUNAT Sincronizada', 
      desc: 'Todos los pagos de mantenimiento han sido registrados y las facturas de servicios emitidas.', 
      icon: ShieldCheck, 
      color: 'text-white' 
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
             <Home className="w-5 h-5 text-[#3b82f6]" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Asistente Axia Condo</h2>
          </div>
          <BaseAxiaChat config={config} />
       </div>

       <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Monitor Residencial</h3>
          {insights.map((ins, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-6 bg-black border border-white/10 rounded-3xl group hover:border-[#3b82f6]/20 transition-all cursor-pointer shadow-xl shadow-black/40"
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

          <div className="p-6 bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-3xl">
             <div className="flex items-center gap-3 mb-2 text-[#3b82f6]">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Alerta de Asamblea</span>
             </div>
             <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase italic">
                "Próxima asamblea para aprobación de presupuesto anual. Recomiendo enviar quorum digital 48h antes."
             </p>
          </div>
       </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
