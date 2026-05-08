import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpCircle, History, Landmark } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useSalaryStore } from '@/store/useSalaryStore'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function SalaryPage() {
  const salaryFund = useFinanceStore((s) => s.funds.salary)
  const deductFromFund = useFinanceStore((s) => s.deductFromFund)
  const { withdrawals, addWithdrawal } = useSalaryStore()
  
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const handleWithdraw = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (isNaN(value) || value <= 0 || value > salaryFund) return

    addWithdrawal(value, note)
    deductFromFund('salary', value)
    
    setAmount('')
    setNote('')
    setShowWithdrawForm(false)
  }

  const recentWithdrawals = withdrawals.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Sueldo de Miguel</h2>
          <p className="text-text-muted text-sm mt-1">Control de ingresos personales y retiros</p>
        </div>
        <button
          onClick={() => setShowWithdrawForm(true)}
          disabled={salaryFund <= 0}
          className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 disabled:bg-surface-2 disabled:text-text-dim text-white rounded-lg transition-colors text-sm font-medium"
        >
          <ArrowUpCircle className="w-4 h-4" />
          Registrar Retiro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Availability Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-success" />
              </div>
              <p className="text-sm font-medium text-text-muted uppercase tracking-widest mb-2">Disponible para Retiro</p>
              <h3 className="text-4xl font-black text-text tracking-tight">{formatCurrency(salaryFund)}</h3>
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-dim">Acumulacion Actual</span>
                  <span className="text-text font-semibold">10% de Ingresos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h4 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
              <Landmark className="w-4 h-4 text-accent" />
              Institucion de Destino
            </h4>
            <div className="p-4 rounded-lg bg-surface-2 border border-border">
              <p className="text-xs text-text-dim uppercase font-bold tracking-tighter">Miguel Montero</p>
              <p className="text-sm text-text font-mono mt-1">BCP Soles **** 1234</p>
              <p className="text-[10px] text-text-muted mt-4">Cuenta vinculada para transferencias de sueldo</p>
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="md:col-span-2 bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-surface-2/50">
            <History className="w-4 h-4 text-text-muted" />
            <h3 className="font-semibold text-text uppercase text-xs tracking-widest">Historial de Retiros</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Nota / Detalle</th>
                  <th className="px-6 py-3 font-medium text-right">Monto Retirado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-text-dim italic">Aun no se han registrado retiros de sueldo</td>
                  </tr>
                ) : (
                  recentWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="px-6 py-4 text-text-muted">{formatDate(w.date)}</td>
                      <td className="px-6 py-4 text-text font-medium">{w.note || 'Retiro de sueldo mensual'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-danger text-sm">-{formatCurrency(w.amount)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text">Registrar Retiro</h3>
              <p className="text-xs text-text-muted mt-1">El monto se deducira de su fondo de sueldo acumulado</p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Monto a Retirar (Max: {formatCurrency(salaryFund)})</label>
                <div className="relative">
                  <input
                    autoFocus
                    type="number"
                    required
                    step="0.01"
                    max={salaryFund}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-4 pr-12 py-3 bg-surface-2 border border-border rounded-lg text-lg font-bold text-text focus:outline-none focus:border-success transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-dim font-bold">SOLES</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Nota Adicional (Opcional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Pago de alquiler, gastos personales..."
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-success transition-colors"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  className="flex-1 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-lg transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-success hover:bg-success/90 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-success/20"
                >
                  Confirmar Retiro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
