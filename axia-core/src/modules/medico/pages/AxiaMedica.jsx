import { useOutletContext } from 'react-router'
import { BaseAxiaChat } from '@/components/base/BaseAxiaChat'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, Briefcase, BarChart3 } from 'lucide-react'

export default function AxiaMedica() {
  const { config } = useOutletContext()

  const insights = [
    { 
      label: 'Insumos Criticos', 
      desc: 'Stock de Gasas y Guantes bajo el umbral ( < 10 und ). Reducción de margen en proformas.', 
      icon: AlertTriangle, 
      color: 'text-red-500' 
    },
    { 
      label: 'Rentabilidad', 
      desc: 'El Dr. Roberto Valdivia genera el 65% de los ingresos hoy. Recomendado programar cirugía.', 
      icon: TrendingDown, 
      color: 'text-turquoise' 
    },
    { 
      label: 'SUNAT', 
      desc: 'Todas las boletas han sido remitidas. Cierre de caja listo para descarga.', 
      icon: Briefcase, 
      color: 'text-white' 
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Asistente Axia Médica</h2>
          <BaseAxiaChat config={config} />
       </div>

       <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Alertas Operativas</h3>
          {insights.map((ins, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-6 bg-black border border-white/10 rounded-3xl"
             >
                <div className="flex items-center gap-3 mb-4">
                   <ins.icon className={cn("w-4 h-4", ins.color)} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">{ins.label}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed uppercase font-bold">
                   {ins.desc}
                </p>
             </motion.div>
          ))}

          <div className="p-6 bg-turquoise/5 border border-turquoise/20 rounded-3xl">
             <div className="flex items-center gap-3 mb-2 text-turquoise">
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sugerencia Proactiva</span>
             </div>
             <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase italic">
                "Detectada baja afluencia los jueves. Sugiero lanzar campaña de WhatsApp para preventivas."
             </p>
          </div>
       </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
