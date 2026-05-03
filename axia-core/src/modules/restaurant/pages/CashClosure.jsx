import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Landmark, ArrowUpRight, CheckCircle, FileText, Download, TrendingUp, DollarSign } from 'lucide-react'
import { useRestaurantStore } from '@/store/useRestaurantStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { exportTablePDF } from '@/lib/pdf'

export default function CashClosure() {
  const { cashShift, openShift, closeShift, sales } = useRestaurantStore()
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')

  const handleOpenShift = (e) => {
    e.preventDefault()
    if (!openingAmount) return
    openShift(openingAmount)
    setShowOpenModal(false)
    setOpeningAmount('')
  }

  const handleCloseShift = () => {
    const report = closeShift()
    // Generate PDF immediately for the closure
    const columns = ['Mesa', 'Monto', 'Hora']
    const rows = cashShift.transactions.map(t => [t.tableName, formatCurrency(t.total), new Date(t.time).toLocaleTimeString()])
    exportTablePDF(`Cierre de Caja - ${formatDate(new Date().toISOString())}`, columns, rows, `cierre_caja_${formatDate(new Date().toISOString(), 'yyyyMMdd')}`)
  }

  const totalSalesThisShift = cashShift.transactions.reduce((acc, t) => acc + Number(t.total), 0)

  return (
    <div className="space-y-6">
      {/* Shift Banner */}
      <div className={cn(
        'p-8 rounded-3xl border flex items-center justify-between relative overflow-hidden transition-all duration-500',
        cashShift.isOpen ? 'bg-success/5 border-success/20' : 'bg-surface-2 border-border'
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-30" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border',
            cashShift.isOpen ? 'bg-success/10 border-success/20 text-success' : 'bg-surface-2 border-border text-text-dim'
          )}>
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text tracking-tighter">
              {cashShift.isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {cashShift.isOpen 
                ? `Modulo POS en linea. Turno iniciado: ${new Date(cashShift.openedAt).toLocaleTimeString()}`
                : 'El modulo POS esta inactivo. Debe abrir caja para procesar ventas.'}
            </p>
          </div>
        </div>

        <div className="relative z-10">
          {cashShift.isOpen ? (
            <button 
               onClick={handleCloseShift}
               className="px-8 py-3 bg-danger text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-danger/90 transition-all shadow-lg shadow-danger/20"
            >
              Cerrar Turno (Z)
            </button>
          ) : (
            <button 
               onClick={() => setShowOpenModal(true)}
               className="px-8 py-3 bg-accent text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Abrir Caja (X)
            </button>
          )}
        </div>
      </div>

      {cashShift.isOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Fondo de Apertura</p>
              <p className="text-2xl font-black text-text">{formatCurrency(cashShift.startingCash)}</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Ventas del Turno</p>
              <p className="text-2xl font-black text-success">{formatCurrency(totalSalesThisShift)}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-success font-bold">
                 <ArrowUpRight className="w-3 h-3" />
                 {cashShift.transactions.length} transacciones
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Efectivo Esperado</p>
              <p className="text-2xl font-black text-accent">{formatCurrency(cashShift.currentCash)}</p>
            </div>

            {/* Shift Transactions Table */}
            <div className="md:col-span-3 bg-surface border border-border rounded-2xl overflow-hidden mt-2">
               <div className="px-6 py-4 border-b border-border bg-surface-2/30">
                  <h3 className="text-sm font-bold text-text uppercase tracking-widest">Actividad del Turno Actual</h3>
               </div>
               <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                     <thead className="bg-surface-2 text-text-muted uppercase font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-3">Hora</th>
                          <th className="px-6 py-3">Mesa</th>
                          <th className="px-6 py-3 text-right">Monto</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {cashShift.transactions.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-10 text-center text-text-dim italic">Sin ventas en este turno</td>
                          </tr>
                        ) : (
                          [...cashShift.transactions].reverse().map(t => (
                            <tr key={t.id} className="hover:bg-surface-2/30 transition-colors">
                              <td className="px-6 py-4 text-text-muted">{new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="px-6 py-4 font-bold text-text uppercase">{t.tableName}</td>
                              <td className="px-6 py-4 text-right font-black text-text">{formatCurrency(t.total)}</td>
                            </tr>
                          ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>

          {/* Bank/Deposit Info Widget */}
          <div className="space-y-6">
             <div className="bg-surface border border-border rounded-2xl p-6">
                <h4 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-accent" />
                  Procedimiento de Cierre
                </h4>
                <ol className="space-y-4">
                   {[
                    'Verificar total de efectivo físico en gaveta',
                    'Conciliar pagos con tarjeta (POS Externo)',
                    'Generar reporte de cierre Z',
                    'Transferir ingresos al fondo global de Axia'
                   ].map((step, i) => (
                     <li key={i} className="flex gap-3 text-xs leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-black flex items-center justify-center shrink-0">
                          {i+1}
                        </span>
                        <p className="text-text-muted">{step}</p>
                     </li>
                   ))}
                </ol>
             </div>

             <div className="bg-surface border border-border rounded-2xl p-6 bg-gradient-to-br from-accent/5 to-transparent">
                <div className="flex items-center gap-2 mb-4 text-accent">
                   <CheckCircle className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Integracion Bancaria</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Al cerrar caja, Axia consolidara los ingresos y generara las provisiones para impuestos (SUNAT) y reserva automaticamente.
                </p>
             </div>
          </div>
        </div>
      )}

      {/* Opening Modal */}
      <AnimatePresence>
        {showOpenModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent border border-accent/20">
                  <DollarSign className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-text uppercase tracking-tighter">Apertura de Caja</h3>
                <p className="text-xs text-text-muted mt-2">Ingrese el monto en efectivo disponible en gaveta para el cambio.</p>
              </div>

              <form onSubmit={handleOpenShift} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-dim font-black uppercase tracking-widest pl-1">Monto Inicial (S/.)</label>
                  <input
                    autoFocus
                    type="number"
                    required
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-6 py-4 bg-surface-2 border border-border rounded-2xl text-2xl font-black text-text focus:outline-none focus:border-accent transition-all text-center"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 py-4 bg-surface-2 hover:bg-surface-3 text-text rounded-2xl transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-accent hover:bg-accent-hover text-white rounded-2xl transition-colors text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent/20"
                  >
                    Abrir Caja
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
