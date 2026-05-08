import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, Phone, Send, Filter } from 'lucide-react'

export default function Morosidad() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'unit', label: 'Unidad' },
    { key: 'owner', label: 'Residente' },
    { key: 'months', label: 'Meses Deuda' },
    { 
      key: 'debt', 
      label: 'Monto Acumulado',
      render: (val) => <span className="font-black text-red-500">{formatCurrency(val)}</span>
    },
    { 
      key: 'action', 
      label: 'Acción',
      render: (_, item) => (
        <button className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all text-[9px] font-black uppercase">
           <Send className="w-3 h-3" /> Notif. WhatsApp
        </button>
      )
    },
  ]

  const data = [
    { unit: 'Torre B - 105', owner: 'Ana Garcia', months: 3, debt: 1260 },
    { unit: 'Torre C - 501', owner: 'Paco Herrera', months: 2, debt: 840 },
    { unit: 'Torre A - 302', owner: 'Jorge Luna', months: 5, debt: 2100 },
  ]

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Ranking de Morosidad</h2>
          <div className="flex items-center gap-2">
             <AlertCircle className="w-4 h-4 text-red-500" />
             <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Total Deuda: {formatCurrency(4200)}</span>
          </div>
       </div>

       <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-4">Aleta de Cobranza Coactiva</h3>
          <p className="text-[11px] text-white/40 uppercase font-black leading-relaxed">
             Actualmente hay 3 unidades con más de 3 meses de deuda. Se recomienda iniciar el proceso de restricción de áreas comunes según reglamento interno.
          </p>
       </div>

       <BaseTables 
         columns={columns}
         data={data}
         primaryColor={config.primaryColor}
       />
    </div>
  )
}
