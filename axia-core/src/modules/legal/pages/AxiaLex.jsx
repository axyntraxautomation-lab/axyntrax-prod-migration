import { useOutletContext } from 'react-router'
import { BaseAxiaChat } from '@/components/base/BaseAxiaChat'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, Gavel, FileText, Scale } from 'lucide-react'

export default function AxiaLex() {
  const { config } = useOutletContext()

  const insights = [
    { 
      label: 'Plazos Criticos', 
      desc: 'El plazo para contestar la demanda del exp. 00124-2026 vence en 72 horas. Prioridad Urgente.', 
      icon: AlertCircle, 
      color: 'text-red-500' 
    },
    { 
      label: 'Performance Honorarios', 
      desc: 'La rentabilidad por hora en Derecho Civil es un 15% mayor que en Laboral. Sugerido priorizar civil.', 
      icon: TrendingUp, 
      color: 'text-green-500' 
    },
    { 
      label: 'Agenda de Audiencias', 
      desc: 'Tienes una audiencia presencial mañana a las 11:00 AM. La toga y documentos deben estar listos.', 
      icon: Gavel, 
      color: 'text-white' 
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
             <Scale className="w-5 h-5 text-red-500" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Asistente Axia Lex</h2>
          </div>
          <BaseAxiaChat config={config} />
       </div>

       <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Monitor Jurídico</h3>
          {insights.map((ins, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-6 bg-black border border-white/10 rounded-3xl group hover:border-[#ef4444]/20 transition-all"
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

          <div className="p-6 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-3xl">
             <div className="flex items-center gap-3 mb-2 text-[#ef4444]">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sugerencia Operativa</span>
             </div>
             <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase italic">
                "Detectado un cuello de botella en la firma de contratos. Recomiendo habilitar firma digital certificada."
             </p>
          </div>
       </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
