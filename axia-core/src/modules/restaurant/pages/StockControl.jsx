import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, ArrowRight, Brain, Filter, Plus, ChevronDown } from 'lucide-react'
import { useRestaurantStore } from '@/store/useRestaurantStore'
import { formatCurrency, cn } from '@/lib/utils'

export default function StockControl() {
  const { menu, getCriticalStock } = useRestaurantStore()
  const [filter, setFilter] = useState('All')
  
  const categories = ['All', 'Platos', 'Bebidas']
  const filteredMenu = filter === 'All' ? menu : menu.filter(m => m.category === filter)
  const criticalItems = getCriticalStock()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text uppercase tracking-tighter">Inventario de Local</h2>
          <p className="text-xs text-text-muted mt-1">Control de insumos y alertas de reposicion</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border text-text rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-3 transition-all">
                <Filter className="w-3.5 h-3.5" />
                Filtrar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-hover transition-all shadow-lg shadow-accent/20">
                <Plus className="w-3.5 h-3.5" />
                Actualizar Stock
            </button>
        </div>
      </div>

      {/* Critical Alerts Strip */}
      {criticalItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center justify-between"
          >
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center text-danger">
                      <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                      <p className="text-sm font-black text-danger uppercase tracking-tighter">Atencion: Quiebre de Stock Detectado</p>
                      <p className="text-xs text-danger/70">Hay {criticalItems.length} productos por debajo del umbral minimo.</p>
                  </div>
              </div>
              <div className="flex -space-x-2">
                {criticalItems.map((item, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-danger border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg" title={item.name}>
                        {item.name.charAt(0)}
                    </div>
                ))}
              </div>
          </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Inventory Table */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-2xl overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-border bg-surface-2/30 flex items-center justify-between">
                <div className="flex gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                                filter === cat ? 'bg-accent text-white' : 'text-text-dim hover:text-text'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest font-black">
                          <tr>
                            <th className="px-6 py-4">Item / Producto</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Stock Actual</th>
                            <th className="px-6 py-4">Precio Venta</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {filteredMenu.map((item) => (
                              <tr key={item.id} className="hover:bg-surface-2/30 transition-colors">
                                  <td className="px-6 py-4 font-bold text-text uppercase">{item.name}</td>
                                  <td className="px-6 py-4 text-text-muted">{item.category}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden w-20">
                                              <div 
                                                className={cn(
                                                    'h-full transition-all duration-500',
                                                    item.stock < 5 ? 'bg-danger' : item.stock < 15 ? 'bg-warning' : 'bg-success'
                                                )}
                                                style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                                              />
                                          </div>
                                          <span className={cn('font-black text-sm', item.stock < 5 ? 'text-danger' : 'text-text')}>{item.stock}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-text-dim">{formatCurrency(item.price)}</td>
                                  <td className="px-6 py-4 text-center">
                                      <div className={cn(
                                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase',
                                          item.stock < 5 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'
                                      )}>
                                          {item.stock < 5 ? 'Reposicion' : 'Optimo'}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Axia Inventory Intelligence */}
          <div className="space-y-6">
              <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-xl" />
                  <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                          <Brain className="w-4 h-4 text-orange-500" />
                          <span className="text-[10px] font-black text-text uppercase tracking-widest">Axia Inventory</span>
                      </div>
                      <div className="space-y-4">
                          <div className="p-3 bg-surface-2 rounded-xl border border-border">
                              <p className="text-[10px] font-bold text-orange-400 uppercase mb-2">Prevision Semanal</p>
                              <p className="text-[11px] text-text-muted leading-relaxed">
                                "La demanda de platos marinos aumentara un 12% este fin de semana. Se recomienda duplicar stock de insumos para 'Ceviche'."
                              </p>
                          </div>
                           <div className="p-3 bg-surface-2 rounded-xl border border-border">
                              <p className="text-[10px] font-bold text-accent-hover uppercase mb-2">Fuga de Capital</p>
                              <p className="text-[11px] text-text-muted leading-relaxed">
                                "Hay excedente de Stock en 'Bebidas Gaseosas'. Evitar nuevas compras hasta reducir inventario en un 30%."
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6">Acciones Rapidas</h4>
                  <div className="space-y-2">
                       <button className="w-full py-3 px-4 rounded-xl border border-border flex items-center justify-between text-xs font-bold text-text-dim hover:text-text hover:bg-surface-2 transition-all">
                          Generar Guia de Compra
                          <ArrowRight className="w-4 h-4" />
                       </button>
                       <button className="w-full py-3 px-4 rounded-xl border border-border flex items-center justify-between text-xs font-bold text-text-dim hover:text-text hover:bg-surface-2 transition-all">
                          Reporte de Mermas
                          <ArrowRight className="w-4 h-4" />
                       </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}
