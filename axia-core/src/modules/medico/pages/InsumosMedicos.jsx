import { useOutletContext } from 'react-router'
import { Package, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react'
import { BaseTables } from '@/components/base/BaseTables'

export default function InsumosMedicos() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'sku', label: 'SKU / Código' },
    { key: 'item', label: 'Concepto de Insumo' },
    { 
      key: 'stock', 
      label: 'Stock Actual',
      render: (val) => (
        <span className={cn(
          "font-black",
          val < 10 ? "text-red-500" : "text-white"
        )}>
          {val} und.
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Alerta',
      render: (val) => (
        <div className="flex items-center gap-2">
           {val === 'Crítico' ? (
             <>
               <AlertTriangle className="w-3 h-3 text-red-500" />
               <span className="text-[9px] font-black uppercase text-red-500">Reabastecer</span>
             </>
           ) : (
             <span className="text-[9px] font-black uppercase text-white/20">Normal</span>
           )}
        </div>
      )
    }
  ]

  const data = [
    { sku: 'INS-001', item: 'Gasas Esterilizadas (Paquete)', stock: 5, status: 'Crítico' },
    { sku: 'INS-002', item: 'Jeringas 5ml (Caja)', stock: 45, status: 'Saludable' },
    { sku: 'INS-003', item: 'Guantes de Nitrilo (Caja)', stock: 8, status: 'Crítico' },
    { sku: 'INS-004', item: 'Alcohol Isopropilico (L)', stock: 12, status: 'Saludable' },
  ]

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Insumos Críticos</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">
             <RefreshCw className="w-4 h-4" /> Sincronizar Stock
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Items Totales', value: '1,240', icon: Package },
            { label: 'Stock Critico', value: '42', icon: AlertTriangle, color: 'text-red-500' },
            { label: 'Ultimo Pedido', value: 'Hace 2 dias', icon: BarChart3 },
          ].map((stat, i) => (
            <div key={i} className="bg-black border border-white/5 rounded-2xl p-6">
               <stat.icon className={cn("w-5 h-5 mb-4", stat.color || "text-white/40")} />
               <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">{stat.label}</p>
               <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          ))}
       </div>

       <BaseTables 
         columns={columns}
         data={data}
         primaryColor={config.primaryColor}
         onAction={(item) => console.log('Replenish:', item)}
       />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
