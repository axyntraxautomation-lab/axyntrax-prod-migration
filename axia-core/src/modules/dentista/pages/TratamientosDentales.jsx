import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { Activity, Clock, CheckCircle2 } from 'lucide-react'

export default function TratamientosDentales() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'patient', label: 'Paciente' },
    { key: 'plan', label: 'Plan de Tratamiento' },
    { 
      key: 'progress', 
      label: 'Progreso',
      render: (val) => (
        <div className="w-full flex items-center gap-3">
           <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000" 
                style={{ width: `${val}%`, backgroundColor: config.primaryColor }} 
              />
           </div>
           <span className="text-[10px] font-mono text-white/40">{val}%</span>
        </div>
      )
    },
    { key: 'next_step', label: 'Siguiente Fase' },
  ]

  const data = [
    { patient: 'Sofia Vergara', plan: 'Ortodoncia Metálica', progress: 45, next_step: 'Ajuste de Arco' },
    { patient: 'Carlos Slim', plan: 'Rehabilitación Oral', progress: 20, next_step: 'Impresiones' },
    { patient: 'Elon Musk', plan: 'Blanqueamiento Led', progress: 90, next_step: 'Finalización' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Tratamientos Activos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         {[
           { label: 'Eficacia Clinica', value: '94%', icon: CheckCircle2, color: 'text-green-500' },
           { label: 'Tiempo Promedio', value: '4.2 meses', icon: Clock, color: 'text-white/40' },
           { label: 'Casos Exitosos', value: '1,240', icon: Activity, color: config.primaryColor },
         ].map((s, i) => (
           <div key={i} className="bg-black border border-white/5 rounded-3xl p-6 flex items-center gap-4">
              <s.icon className={cn("w-6 h-6", s.color)} />
              <div>
                 <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">{s.label}</p>
                 <p className="text-xl font-black text-white">{s.value}</p>
              </div>
           </div>
         ))}
      </div>

      <BaseTables 
        columns={columns}
        data={data}
        primaryColor={config.primaryColor}
        onAction={(item) => console.log('Edit treatment:', item)}
      />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
