import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function ApprovalDialog({ expense, onApprove, onReject, onClose }) {
  if (!expense) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-text">Aprobacion Requerida</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 transition-colors">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Proveedor</span>
              <span className="text-text font-medium">{expense.provider}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Concepto</span>
              <span className="text-text font-medium">{expense.concept}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Monto</span>
              <span className="text-warning font-bold text-lg">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Factura</span>
              <span className="text-text">{expense.invoiceNumber || 'Adjunta'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onReject(expense.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
            <button
              onClick={() => onApprove(expense.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-success text-white hover:bg-success/90 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
