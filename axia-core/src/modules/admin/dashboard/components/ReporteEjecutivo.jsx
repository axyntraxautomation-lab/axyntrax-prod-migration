import { motion } from 'framer-motion'
import { FileText, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useLeadStore } from '@/store/useLeadStore'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { useAxiaStore } from '@/store/useAxiaStore'
import { formatCurrency } from '@/lib/utils'

export const ReporteEjecutivo = () => {
  const { newCount } = useLeadStore()
  const { funds, getMonthlyIncomes } = useFinanzaStore()
  const { alerts, metrics } = useAxiaStore()
  
  const sections = [
    { 
       title: 'Flujo Financiero', 
       items: [
         { label: 'Ingresos Mes', value: formatCurrency(getMonthlyIncomes()) },
         { label: 'Fondo Operativo', value: formatCurrency(funds.operative) }
       ],
       status: 'safe' 
    },
    { 
       title: 'Crecimiento (Leads)', 
       items: [
         { label: 'Nuevos Hoy', value: newCount },
         { label: 'Tasa Conversión', value: '12.5%' }
       ],
       status: 'info' 
    },
    { 
       title: 'Motor Axia', 
       items: [
         { label: 'Calidad Ejecución', value: `${metrics.systemQuality}%` },
         { label: 'Alertas Activas', value: alerts.filter(a => !a.dismissed).length }
       ],
       status: alerts.length > 0 ? 'warning' : 'safe'
    }
  ]

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
           <FileText className="w-5 h-5 text-turquoise" />
           <h3 className="text-xs font-black uppercase tracking-widest text-white">Reporte Ejecutivo Diario</h3>
        </div>
        <span className="text-[10px] font-mono text-white/30 uppercase">{new Date().toLocaleDateString('es-PE')}</span>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-tighter text-white/40">{section.title}</h4>
                {section.status === 'safe' && <CheckCircle2 className="w-3 h-3 text-turquoise" />}
                {section.status === 'warning' && <AlertTriangle className="w-3 h-3 text-red-500" />}
             </div>
             <div className="grid grid-cols-2 gap-4">
                {section.items.map((item, i) => (
                   <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-white/30 mb-1">{item.label}</p>
                      <p className="text-xs font-bold text-white tracking-tight">{item.value}</p>
                   </div>
                ))}
             </div>
          </div>
        ))}

        <div className="pt-6 mt-6 border-t border-white/10">
           <button className="w-full group flex items-center justify-between p-4 bg-turquoise/10 border border-turquoise/30 rounded-2xl hover:bg-turquoise transition-all">
              <span className="text-[10px] font-black uppercase tracking-widest text-turquoise group-hover:text-black">Sugerencias Axia</span>
              <ArrowRight className="w-4 h-4 text-turquoise group-hover:text-black group-hover:translate-x-1 transition-all" />
           </button>
        </div>
      </div>
    </div>
  )
}
