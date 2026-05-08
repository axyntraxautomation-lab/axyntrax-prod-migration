import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ShieldAlert, MessageSquare } from 'lucide-react'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { formatCurrency } from '@/lib/utils'

export const AprobacionGastos = () => {
  const { getPendingExpenses, approveExpense, rejectExpense } = useFinanzaStore()
  const pending = getPendingExpenses()
  
  const [selectedId, setSelectedId] = useState(null)
  const [motive, setMotive] = useState('')

  const handleAction = (id, action) => {
    if (action === 'approve') approveExpense(id, motive)
    else rejectExpense(id, motive)
    setSelectedId(null)
    setMotive('')
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {pending.map((expense) => (
          <motion.div
            key={expense.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-black border border-white/10 rounded-3xl p-6 overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-turquoise/20 rounded-lg">
                   <ShieldAlert className="w-4 h-4 text-turquoise" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Aprobacion Ejecutiva</span>
              </div>
              <span className="text-sm font-black text-white">{formatCurrency(expense.amount)}</span>
            </div>

            <p className="text-white text-sm font-bold mb-1">{expense.concept}</p>
            <p className="text-white/40 text-[10px] font-black uppercase mb-6">{expense.provider}</p>

            {selectedId === expense.id ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <MessageSquare className="w-4 h-4 text-white/30" />
                  <input 
                    type="text" 
                    placeholder="Motivo o comentario (opcional)"
                    className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20 w-full"
                    autoFocus
                    value={motive}
                    onChange={e => setMotive(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleAction(expense.id, 'reject')}
                    className="py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleAction(expense.id, 'approve')}
                    className="py-3 bg-turquoise text-black font-black uppercase text-[10px] rounded-xl hover:bg-white transition-all"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setSelectedId(expense.id)}
                className="w-full py-3 bg-white/5 border border-white/5 rounded-xl hover:border-turquoise/30 flex items-center justify-center gap-2 group transition-all"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-turquoise">Evaluar Gasto</div>
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
