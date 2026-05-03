import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Coffee, Utensils, CreditCard, ChevronRight, Check } from 'lucide-react'
import { useRestaurantStore } from '@/store/useRestaurantStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, cn } from '@/lib/utils'

export default function TableMap() {
  const { tables, menu, updateTableStatus, addToOrder, clearOrder, processSale, updateStock } = useRestaurantStore()
  const addGlobalIncome = useFinanceStore((s) => s.addIncome)
  
  const [selectedTable, setSelectedTable] = useState(null)
  const [category, setCategory] = useState('Platos')

  const activeTable = useMemo(() => 
    tables.find(t => t.id === selectedTable?.id), 
    [tables, selectedTable]
  )

  const handleProcessPayment = () => {
    if (!activeTable) return
    const total = activeTable.currentOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    
    const sale = {
      type: 'restaurant_sale',
      tableId: activeTable.id,
      tableName: activeTable.label,
      items: activeTable.currentOrder,
      total: total,
      paymentMethod: 'Cash/Card'
    }

    // Process in restaurant store
    processSale(sale)
    updateStock(activeTable.currentOrder)
    
    // Sync with global finance
    addGlobalIncome({
      clientName: `Cliente ${activeTable.label}`,
      amount: total,
      concept: `Venta Restaurante - ${activeTable.label}`
    })

    clearOrder(activeTable.id)
    setSelectedTable(null)
  }

  return (
    <div className="flex gap-6 h-full relative">
      {/* Table Map Grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 content-start">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied'
          const isWaiting = table.status === 'waiting'
          const total = table.currentOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0)

          return (
            <motion.button
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={cn(
                'aspect-square rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group',
                isOccupied ? 'bg-danger/10 border-danger/40 shadow-lg shadow-danger/10' : 
                isWaiting ? 'bg-warning/10 border-warning/40' : 
                'bg-surface border-border hover:border-accent hover:bg-accent/5'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-1',
                isOccupied ? 'bg-danger/20 text-danger' : 
                isWaiting ? 'bg-warning/20 text-warning' : 
                'bg-surface-2 text-text-dim group-hover:text-accent group-hover:bg-accent/10'
              )}>
                {table.label.includes('Bar') ? <Coffee className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
              </div>
              <span className={cn('text-xs font-black uppercase tracking-widest', isOccupied ? 'text-danger' : 'text-text')}>
                {table.label}
              </span>
              {isOccupied && (
                <span className="text-[10px] font-bold text-danger/80">{formatCurrency(total)}</span>
              )}
              {!isOccupied && !isWaiting && (
                <span className="text-[8px] text-text-dim uppercase font-bold">Libre</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* POS Drawer / Order Panel */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-2/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text uppercase tracking-widest">{activeTable.label}</h3>
                  <p className="text-[10px] text-text-muted">Estado: <span className="text-accent uppercase font-bold">{activeTable.status}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTable(null)}
                className="p-2 rounded-full hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Menu Selection (if occupied/waiting) */}
            <div className="flex-1 flex overflow-hidden">
               {/* Categories */}
               <div className="w-20 border-r border-border py-4 flex flex-col items-center gap-4">
                  {['Platos', 'Bebidas'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                        category === cat ? 'bg-accent text-white shadow-lg' : 'bg-surface-2 text-text-dim hover:bg-surface-3'
                      )}
                    >
                      {cat === 'Platos' ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                    </button>
                  ))}
               </div>

               {/* Items Grid */}
               <div className="flex-1 flex flex-col">
                  <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[350px]">
                    {menu.filter(m => m.category === category).map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          addToOrder(activeTable.id, item)
                          updateTableStatus(activeTable.id, 'occupied')
                        }}
                        className="p-4 rounded-2xl bg-surface-2 border border-border hover:border-accent hover:bg-accent/5 text-left transition-all group"
                      >
                        <p className="text-xs font-bold text-text group-hover:text-accent">{item.name}</p>
                        <p className="text-sm font-black text-accent-hover mt-1">{formatCurrency(item.price)}</p>
                        <p className="text-[10px] text-text-dim mt-2">Stock: {item.stock}</p>
                      </button>
                    ))}
                  </div>

                  {/* Current Order List */}
                  <div className="flex-1 border-t border-border flex flex-col bg-surface-2/20">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-border/50">
                      <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Pedido Actual</span>
                      <span className="text-xs font-bold text-accent">{activeTable.currentOrder.length} Items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                      {activeTable.currentOrder.length === 0 ? (
                        <p className="text-xs text-text-dim italic text-center py-10">Sin consumos registrados</p>
                      ) : (
                        activeTable.currentOrder.map(oi => (
                          <div key={oi.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">x{oi.quantity}</span>
                              <span className="text-xs text-text">{oi.name}</span>
                            </div>
                            <span className="text-xs font-bold text-text">{formatCurrency(oi.price * oi.quantity)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-surface shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-text-muted uppercase">Total de la Cuenta</span>
                <span className="text-3xl font-black text-accent tracking-tighter">
                  {formatCurrency(activeTable.currentOrder.reduce((acc, i) => acc + (i.price * i.quantity), 0))}
                </span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { clearOrder(activeTable.id); setSelectedTable(null); }}
                  className="flex-1 py-3 rounded-xl border border-danger/30 text-danger text-sm font-bold hover:bg-danger/5 transition-colors uppercase tracking-widest"
                >
                  Vaciar Mesa
                </button>
                <button 
                  onClick={handleProcessPayment}
                  disabled={activeTable.currentOrder.length === 0}
                  className="flex-[2] py-3 rounded-xl bg-success text-white text-sm font-bold hover:bg-success/90 transition-all shadow-lg shadow-success/20 uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  Cobrar y Liberar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
