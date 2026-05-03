import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Search, Eye, Filter, Download } from 'lucide-react'
import { useRestaurantStore } from '@/store/useRestaurantStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { exportTablePDF } from '@/lib/pdf'

export default function SalesList() {
  const { sales } = useRestaurantStore()
  const [search, setSearch] = useState('')

  const filteredSales = sales.filter(s => 
    s.type !== 'shift_closure' && 
    (s.tableName?.toLowerCase().includes(search.toLowerCase()) || s.id?.includes(search))
  )

  const handleExport = () => {
    const columns = ['ID', 'Fecha', 'Mesa', 'Total']
    const rows = filteredSales.map(s => [s.id, formatDate(s.date), s.tableName, formatCurrency(s.total)])
    exportTablePDF('Ventas del Dia - Restaurante', columns, rows, 'ventas_pos')
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-2/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10">
            <ClipboardList className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-text uppercase tracking-widest text-sm">Ventas del Dia</h3>
            <p className="text-[10px] text-text-dim">Historico detallado de transacciones POS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder="Buscar mesa o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-xs text-text focus:outline-none focus:border-accent w-64 transition-all focus:w-80"
              />
           </div>
           <button 
             onClick={handleExport}
             className="p-2.5 rounded-xl bg-surface-2 border border-border hover:bg-surface-3 transition-colors text-text-muted hover:text-text"
           >
              <Download className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest sticky top-0">
            <tr>
              <th className="px-6 py-4 font-black">ID Venta</th>
              <th className="px-6 py-4 font-black">Hora / Fecha</th>
              <th className="px-6 py-4 font-black">Mesa / Origen</th>
              <th className="px-6 py-4 font-black">Items</th>
              <th className="px-6 py-4 font-black text-right">Monto Total</th>
              <th className="px-6 py-4 font-black text-center">Estado</th>
              <th className="px-6 py-4 font-black text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-20 text-center text-text-dim italic">
                   No se han registrado ventas en el periodo actual
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-surface-2/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-accent text-xs">#{sale.id.slice(-6)}</td>
                  <td className="px-6 py-4 text-text-muted text-xs">
                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-surface-2 rounded-lg text-[10px] font-black text-text-muted uppercase">
                      {sale.tableName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2 overflow-hidden">
                       {sale.items.map((item, i) => (
                         <div key={i} className="w-6 h-6 rounded-full bg-accent/20 border border-bg flex items-center justify-center text-[8px] font-bold text-accent" title={item.name}>
                           {item.name.charAt(0)}
                         </div>
                       ))}
                       {sale.items.length > 3 && (
                         <div className="w-6 h-6 rounded-full bg-surface-2 border border-bg flex items-center justify-center text-[8px] font-bold text-text-dim">
                           +{sale.items.length - 3}
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-text">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status="approved" className="bg-success/10 text-success border-success/20" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-6 bg-surface-2/10 border-t border-border flex items-center justify-between">
         <div className="flex gap-8">
            <div>
              <p className="text-[10px] text-text-dim uppercase font-black tracking-widest mb-1">Ventas Totales</p>
              <p className="text-xl font-black text-text">{filteredSales.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-dim uppercase font-black tracking-widest mb-1">Monto Acumulado</p>
              <p className="text-xl font-black text-success">
                {formatCurrency(filteredSales.reduce((acc, s) => acc + Number(s.total), 0))}
              </p>
            </div>
         </div>
         <div className="opacity-40 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-text-dim uppercase">Filtro: Hoy</span>
         </div>
      </div>
    </div>
  )
}
