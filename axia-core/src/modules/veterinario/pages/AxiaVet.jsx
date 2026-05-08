import { useOutletContext } from 'react-router'
import { BaseAxiaChat } from '@/components/base/BaseAxiaChat'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Briefcase, BarChart3, Dog } from 'lucide-react'

export default function AxiaVet() {
  const { config } = useOutletContext()

  const insights = [
    { 
      label: 'Campañas de Vacunación', 
      desc: 'Detectadas 4 vacunas vencidas hoy. Recomiendo enviar recordatorio automático al tutor.', 
      icon: AlertTriangle, 
      color: 'text-amber-500' 
    },
    { 
      label: 'Performance PetShop', 
      desc: 'El ticket promedio de PetShop subió un 20% esta semana gracias a ofertas en alimentos.', 
      icon: TrendingUp, 
      color: 'text-green-500' 
    },
    { 
      label: 'Servicios SUNAT', 
      desc: 'Sincronización al día. No hay discrepancias en el cierre de caja de ayer.', 
      icon: Briefcase, 
      color: 'text-white' 
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
             <Dog className="w-5 h-5 text-amber-500" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Inteligencia Axia Vet</h2>
          </div>
          <BaseAxiaChat config={config} />
       </div>

       <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Monitor Operativo</h3>
          {insights.map((ins, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-6 bg-black border border-white/10 rounded-3xl group hover:border-amber-500/20 transition-all"
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

          <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
             <div className="flex items-center gap-3 mb-2 text-amber-500">
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sugerencia de Crecimiento</span>
             </div>
             <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase italic">
                "La clientela felina ha crecido. Recomiendo ampliar el catálogo de accesorios y salud para gatos."
             </p>
          </div>
       </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
