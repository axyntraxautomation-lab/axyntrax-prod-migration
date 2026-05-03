import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { AlertCircle, Clock, CheckCircle2, Hammer, Plus } from 'lucide-react'

export default function Incidencias() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: 'Categoría' },
    { key: 'description', label: 'Descripción' },
    { 
      key: 'status', 
      label: 'Estado',
      render: (val) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          val === 'Abierto' ? "bg-red-500/10 text-red-500" : 
          val === 'Resuelto' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
        )}>
          {val}
        </span>
      )
    },
    { key: 'date', label: 'Fecha Reporte' },
  ]

  const data = [
    { id: 'INC-205', category: 'Electrico', description: 'Luz Ascensor B fundida', status: 'Abierto', date: '21/04/2026' },
    { id: 'INC-210', category: 'Plomeria', description: 'Fuga Agua Sotano 2', status: 'En Proceso', date: '21/04/2026' },
    { id: 'INC-198', category: 'Piscina', description: 'Filtro Piscina Obstruido', status: 'Resuelto', date: '19/04/2026' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestión de Incidencias</h2>
      
      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Categorias', icon: Hammer },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         {[
           { label: 'Abiertas', value: '05', icon: AlertCircle, color: 'text-red-500' },
           { label: 'En Proceso', value: '02', icon: Clock, color: 'text-amber-500' },
           { label: 'Resueltas Mes', value: '14', icon: CheckCircle2, color: 'text-green-500' },
         ].map((s, i) => (
           <div key={i} className="bg-black border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
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
        onAction={(item) => console.log('Update status for:', item)}
      />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
