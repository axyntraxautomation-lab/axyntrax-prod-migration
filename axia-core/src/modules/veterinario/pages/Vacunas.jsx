import { useOutletContext } from 'react-router'
import { Calendar, ShieldCheck, AlertCircle, CheckCircle2, Bell } from 'lucide-react'
import { BaseTables } from '@/components/base/BaseTables'

export default function Vacunas() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'pet', label: 'Paciente (Mascota)' },
    { key: 'vaccine', label: 'Vacuna / Dosis' },
    { key: 'date', label: 'Fecha Prog.' },
    { 
      key: 'status', 
      label: 'Estado',
      render: (val) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          val === 'Pendiente' ? "bg-amber-500/10 text-amber-500" : 
          val === 'Vencida' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
        )}>
          {val}
        </span>
      )
    },
  ]

  const data = [
    { pet: 'Toby', vaccine: 'Antirrábica', date: '25/04/2026', status: 'Pendiente' },
    { pet: 'Luna', vaccine: 'Quintuple', date: '20/04/2026', status: 'Vencida' },
    { pet: 'Simba', vaccine: 'Triple Felina', date: '10/05/2026', status: 'Pendiente' },
    { pet: 'Rocky', vaccine: 'Desparasitación', date: '15/04/2026', status: 'Aplicada' },
  ]

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Plan de Inmunización</h2>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#f59e0b] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-all">
             <Bell className="w-4 h-4" /> Notificar Pendientes
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Proximas 7 dias', value: '12', icon: Calendar, color: 'text-amber-500' },
            { label: 'Vencidas Hoy', value: '4', icon: AlertCircle, color: 'text-red-500' },
            { label: 'Aplicadas Mes', value: '145', icon: CheckCircle2, color: 'text-green-500' },
          ].map((s, i) => (
            <div key={i} className="bg-black border border-white/5 rounded-2xl p-6 flex items-center gap-4">
               <s.icon className={cn("w-6 h-6", s.color)} />
               <div>
                  <p className="text-[10px] font-black uppercase text-white/30">{s.label}</p>
                  <p className="text-xl font-black text-white">{s.value}</p>
               </div>
            </div>
          ))}
       </div>

       <BaseTables 
         columns={columns}
         data={data}
         primaryColor={config.primaryColor}
         onAction={(item) => console.log('Apply vaccine:', item)}
       />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
