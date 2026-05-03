import { motion } from 'framer-motion'
import { FileText, Check, X, AlertCircle } from 'lucide-react'
import { useTenantStore } from '@/store/useTenantStore'
import { formatCurrency } from '@/lib/utils'

export const GastosPendientes = () => {
  const { pendingExpenses, approveExpense } = useTenantStore()
  
  return (
    <div className="bg-black border border-white/10 rounded-3xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-turquoise" />
          Gastos Pendientes
        </h3>
        <span className="text-[10px] font-bold text-white/40 uppercase">Factura Obligatoria</span>
      </div>
      
      <div className="space-y-3">
        {pendingExpenses.filter(e => e.status === 'pending').map((expense, i) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-turquoise/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-turquoise/10 rounded-lg text-turquoise">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none mb-1">{expense.concept}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-white/30">Monto:</span>
                  <span className="text-[10px] font-bold text-white/70">{formatCurrency(expense.amount)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {expense.invoice && (
                <div className="px-2 py-1 bg-white/5 text-[9px] font-black uppercase text-white/50 rounded border border-white/10">
                  PDF OK
                </div>
              )}
              <button 
                onClick={() => approveExpense(expense.id)}
                className="p-2 bg-turquoise text-black rounded-lg hover:bg-white transition-colors"
                title="Aprobar"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        
        {pendingExpenses.filter(e => e.status === 'pending').length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Sin gastos pendientes</p>
          </div>
        )}
      </div>
    </div>
  )
}
