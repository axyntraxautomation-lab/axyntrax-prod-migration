import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { Briefcase, FileText, Search, User, Filter } from 'lucide-react'

export default function Expedientes() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'exp_code', label: 'N° Expediente' },
    { key: 'client', label: 'Cliente' },
    { key: 'materia', label: 'Materia / Especialidad' },
    { 
      key: 'status', 
      label: 'Estado Proceso',
      render: (val) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          val === 'En Tramite' ? "bg-amber-500/10 text-amber-500" : 
          val === 'Sentenciado' ? "bg-green-500/10 text-green-500" : "bg-white/5 text-white/40"
        )}>
          {val}
        </span>
      )
    },
    { key: 'lawyer', label: 'Abogado Responsable' },
  ]

  const data = [
    { exp_code: '00124-2026', client: 'Corporacion Alpha', materia: 'Derecho Civil', status: 'En Tramite', lawyer: 'Dr. Valdivia' },
    { exp_code: '00542-2025', client: 'Inmobiliaria Gamma', materia: 'Derecho Laboral', status: 'Sentenciado', lawyer: 'Dra. Sanchez' },
    { exp_code: '00981-2026', client: 'Miguel Montero', materia: 'Derecho Penal', status: 'En Tramite', lawyer: 'Dr. Lopez' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Control de Expedientes</h2>
      
      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Filtrar Abogado', icon: User },
          { label: 'Estados', icon: Filter },
        ]}
      />

      <BaseTables 
        columns={columns}
        data={data}
        primaryColor={config.primaryColor}
        onAction={(item) => console.log('View case details:', item)}
      />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
