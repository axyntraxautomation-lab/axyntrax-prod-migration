import { useOutletContext } from 'react-router'
import { BaseTables } from '@/components/base/BaseTables'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, DollarSign, Receipt, Landmark } from 'lucide-react'

export default function CobrosDentales() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'patient', label: 'Paciente' },
    { key: 'concept', label: 'Concepto / Tratamiento' },
    { 
      key: 'type', 
      label: 'Tipo de Pago',
      render: (val) => <span className="text-[9px] uppercase font-black text-white/30">{val}</span>
    },
    { 
      key: 'amount', 
      label: 'Monto Cobrado',
      render: (val) => <span className="text-sm font-black text-white">{formatCurrency(val)}</span>
    },
  ]

  const data = [
    { patient: 'Sofia Vergara', concept: 'Cuota Ortodoncia (4/12)', type: 'Tarjeta', amount: 350 },
    { patient: 'Carlos Slim', concept: 'Acuenta Implante (Fase 1)', type: 'Efectivo', amount: 1200 },
    { patient: 'Elon Musk', concept: 'Profilaxis Completa', type: 'Transferencia', amount: 150 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Caja y Cobranzas</h2>
         <button className="px-6 py-3 bg-[#ec4899] text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white hover:text-black transition-all">Generar Cierre Dental</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="md:col-span-3">
            <BaseTables 
               columns={columns}
               data={data}
               primaryColor={config.primaryColor}
               onAction={(item) => console.log('Print receipt for:', item)}
            />
         </div>

         <div className="space-y-6">
            <div className="bg-black border border-white/10 rounded-3xl p-6">
               <h4 className="text-[10px] font-black uppercase text-white/40 mb-6 font-mono tracking-widest">Totales Hoy</h4>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-white/30">Total Cobrado</span>
                     <span className="text-sm font-black text-white">{formatCurrency(1700)}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-white/30">Por Cobrar</span>
                     <span className="text-sm font-black text-[#ec4899]">{formatCurrency(12400)}</span>
                  </div>
               </div>
            </div>

            <div className="bg-[#ec4899]/5 border border-[#ec4899]/10 rounded-3xl p-6">
               <h4 className="text-[10px] font-black uppercase text-[#ec4899] mb-4">Metodos de Pago</h4>
               <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                     <Landmark className="w-4 h-4 text-white/20" />
                     <span className="text-[10px] font-bold text-white/60">Efectivo: S/. 1,200</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <CreditCard className="w-4 h-4 text-white/20" />
                     <span className="text-[10px] font-bold text-white/60">Tarjetas: S/. 500</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
