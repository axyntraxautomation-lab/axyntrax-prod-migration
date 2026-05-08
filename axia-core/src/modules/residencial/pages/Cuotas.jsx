import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { formatCurrency } from '@/lib/utils'
import { Receipt, FileDown, Plus, Search } from 'lucide-react'

export default function Cuotas() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'unit', label: 'Unidad / Dpto' },
    { key: 'owner', label: 'Propietario / Residente' },
    { key: 'concept', label: 'Concepto' },
    { 
      key: 'amount', 
      label: 'Importe',
      render: (val) => <span className="font-black text-white">{formatCurrency(val)}</span>
    },
    { 
      key: 'status', 
      label: 'Estado',
      render: (val) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          val === 'Pagado' ? "bg-green-500/10 text-green-500" : "bg-white/5 text-white/40"
        )}>
          {val}
        </span>
      )
    },
  ]

  const data = [
    { unit: 'Torre A - 402', owner: 'Miguel Montero', concept: 'Mantenimiento Abr 2026', amount: 350, status: 'Pagado' },
    { unit: 'Torre B - 105', owner: 'Ana Garcia', concept: 'Mantenimiento Abr 2026', amount: 420, status: 'Pendiente' },
    { unit: 'Torre A - 210', owner: 'Robert Valdivia', concept: 'Cuota Extraordinaria Pintado', amount: 150, status: 'Pagado' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Control de Cuotas</h2>
      
      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Recibo', icon: Receipt },
          { label: 'Exportar', icon: FileDown },
        ]}
      />

      <BaseTables 
        columns={columns}
        data={data}
        primaryColor={config.primaryColor}
        onAction={(item) => console.log('Issue receipt:', item)}
      />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
