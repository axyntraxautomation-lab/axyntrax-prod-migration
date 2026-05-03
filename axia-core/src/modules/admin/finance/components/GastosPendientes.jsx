import { motion } from 'framer-motion'
import { AlertCircle, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { formatCurrency } from '@/lib/utils'

export const GastosPendientes = () => {
  const { expenses } = useFinanzaStore()
  const pending = expenses.filter(e => e.status === 'pending')

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-turquoise">Gastos Pendientes</h3>
        <div className="flex items-center gap-2 text-white/40">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Factura Requerida</span>
        </div>
      </div>

      <div className="space-y-4">
        {pending.map((expense, i) => (
          <motion.div
            key={expense.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/50 group-hover:text-turquoise transition-colors">
                 {expense.invoice ? <FileText className="w-6 h-6" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">{expense.concept}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase">
                   <span className="text-white/40">{expense.provider}</span>
                   <span className="w-1 h-1 bg-white/20 rounded-full" />
                   <span className="text-turquoise">{formatCurrency(expense.amount)}</span>
                </div>
              </div>
            </div>
            
            {!expense.invoice && (
              <div className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                Bloqueado
              </div>
            )}
          </motion.div>
        ))}

        {pending.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
            <CheckCircle2 className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sin gastos por autorizar</p>
          </div>
        )}
      </div>
    </div>
  )
}
