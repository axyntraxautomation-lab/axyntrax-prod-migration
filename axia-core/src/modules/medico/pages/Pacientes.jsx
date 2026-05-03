import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { Printer, Download, Mail } from 'lucide-react'

export default function Pacientes() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'dni', label: 'DNI / Historia' },
    { key: 'name', label: 'Nombre del Paciente' },
    { key: 'last_visit', label: 'Última Visita' },
    { 
      key: 'status', 
      label: 'Estado',
      render: (val) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          val === 'Activo' ? "bg-green-500/10 text-green-500" : "bg-white/5 text-white/40"
        )}>
          {val}
        </span>
      )
    },
  ]

  const data = [
    { dni: '72834912', name: 'Alvaro Sanchez', last_visit: '15/04/2026', status: 'Activo' },
    { dni: '10923847', name: 'Maria Loayza', last_visit: '20/04/2026', status: 'Activo' },
    { dni: '44556677', name: 'Jorge Perez', last_visit: '01/01/2026', status: 'Inactivo' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registro de Pacientes</h2>
      
      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Exportar', icon: Download },
          { label: 'Notificar', icon: Mail },
        ]}
      />

      <BaseTables 
        columns={columns}
        data={data}
        primaryColor={config.primaryColor}
        onAction={(item) => console.log('Action on:', item)}
      />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
