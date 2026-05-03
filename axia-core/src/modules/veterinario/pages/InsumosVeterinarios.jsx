import { useOutletContext } from 'react-router'
import { Package, ShoppingCart, Activity, AlertCircle } from 'lucide-react'
import { BaseTables } from '@/components/base/BaseTables'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'

export default function InsumosVeterinarios() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'category', label: 'Categoría' },
    { key: 'item', label: 'Insumo / Producto' },
    { key: 'stock', label: 'Stock' },
    { 
      key: 'price', 
      label: 'Precio Venta',
      render: (val) => <span className="font-mono text-xs text-white/60">S/. {val}</span>
    },
    { 
      key: 'status', 
      label: 'Estado',
      render: (val) => val === 'Bajo' ? <span className="text-[9px] font-black uppercase text-red-500">Reponer</span> : <span className="text-[9px] font-black uppercase text-white/20">OK</span>
    }
  ]

  const data = [
    { category: 'Farmacia', item: 'Antibiótico Oral 100mg', stock: 12, price: '45.00', status: 'OK' },
    { category: 'PetShop', item: 'Alimento Premium Adulto 15kg', stock: 3, price: '180.00', status: 'Bajo' },
    { category: 'Insumos', item: 'Jeringas 3ml (Caja)', stock: 50, price: '25.00', status: 'OK' },
    { category: 'Accesorios', item: 'Collar Isabelino L', stock: 2, price: '35.00', status: 'Bajo' },
  ]

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Inventario y PetShop</h2>
       
       <BaseActionsBar 
         primaryColor={config.primaryColor}
         onNew={() => {}}
         actions={[
           { label: 'Categorias', icon: Package },
           { label: 'Venta Rapida', icon: ShoppingCart },
         ]}
       />

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black border border-white/5 rounded-3xl p-8 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Valor PetShop</p>
                <p className="text-3xl font-black text-white italic">S/. 14,800.00</p>
             </div>
             <Activity className="w-10 h-10 text-amber-500/20" />
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black uppercase text-red-500/50 tracking-widest mb-1">Alertas de Stock</p>
                <p className="text-3xl font-black text-white">08 <span className="text-xs uppercase text-white/20">Items</span></p>
             </div>
             <AlertCircle className="w-10 h-10 text-red-500/20" />
          </div>
       </div>

       <BaseTables 
         columns={columns}
         data={data}
         primaryColor={config.primaryColor}
         onAction={(item) => console.log('Edit item:', item)}
       />
    </div>
  )
}
