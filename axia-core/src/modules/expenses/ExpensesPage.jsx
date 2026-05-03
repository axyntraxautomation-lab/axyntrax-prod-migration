import { useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, Plus, CheckCircle, XCircle, AlertCircle, FileCheck, Search } from 'lucide-react'
import { useExpenseStore } from '@/store/useExpenseStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatDate, truncate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ApprovalDialog } from '@/components/shared/ApprovalDialog'
import { EXPENSE_APPROVAL_THRESHOLD } from '@/lib/constants'

export default function ExpensesPage() {
  const { expenses, approvalQueue, addExpense, approveExpense, rejectExpense } = useExpenseStore()
  const deductFromFund = useFinanceStore((s) => s.deductFromFund)
  
  const [showForm, setShowForm] = useState(false)
  const [selectedForApproval, setSelectedForApproval] = useState(null)
  const [search, setSearch] = useState('')
  const [newExpense, setNewExpense] = useState({ provider: '', amount: '', concept: '', invoiceNumber: '', fundSource: 'operative' })

  const handleAddExpense = (e) => {
    e.preventDefault()
    if (!newExpense.provider || !newExpense.amount || !newExpense.invoiceNumber) {
      alert("Factura obligatoria para registrar gasto.")
      return
    }

    const expenseData = { ...newExpense, amount: Number(newExpense.amount) }
    addExpense(expenseData)
    
    // If it's below threshold, we deduct immediately
    if (expenseData.amount <= EXPENSE_APPROVAL_THRESHOLD) {
      deductFromFund(expenseData.fundSource, expenseData.amount)
    }

    setNewExpense({ provider: '', amount: '', concept: '', invoiceNumber: '', fundSource: 'operative' })
    setShowForm(false)
  }

  const handleApprove = (id) => {
    const item = approvalQueue.find(e => e.id === id)
    if (item) {
      approveExpense(id)
      deductFromFund(item.fundSource, item.amount)
    }
    setSelectedForApproval(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Gastos con Factura</h2>
          <p className="text-text-muted text-sm mt-1">Control de egresos y validacion de comprobantes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Registrar Gasto
        </button>
      </div>

      {/* Approval Alert */}
      {approvalQueue.length > 0 && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warning">Aprobaciones Pendientes</p>
              <p className="text-xs text-warning/80">Hay {approvalQueue.length} gastos que superan el umbral de S/. {EXPENSE_APPROVAL_THRESHOLD} esperando validacion.</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedForApproval(approvalQueue[0])}
            className="px-4 py-1.5 bg-warning text-bg text-xs font-bold rounded-lg hover:bg-warning/90 transition-colors"
          >
            Revisar Ahora
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50 backdrop-blur-sm sticky top-0">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-text uppercase text-xs tracking-widest">Historial de Egresos</h3>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-text focus:outline-none focus:border-accent w-48 transition-all focus:w-60"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Proveedor</th>
                  <th className="px-6 py-3 font-medium">Factura</th>
                  <th className="px-6 py-3 font-medium">Monto</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-dim italic">No hay gastos aprobados aun</td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-2/30 transition-colors text-xs font-medium">
                      <td className="px-6 py-4 text-text-muted">{formatDate(e.date)}</td>
                      <td className="px-6 py-4 text-text uppercase">{truncate(e.provider, 20)}</td>
                      <td className="px-6 py-4 text-text-dim font-mono">{e.invoiceNumber}</td>
                      <td className="px-6 py-4 font-bold text-danger">-{formatCurrency(e.amount)}</td>
                      <td className="px-6 py-4"><StatusBadge status={e.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approval Stream */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-fit">
          <div className="px-6 py-4 border-b border-border bg-surface-2/30">
            <h3 className="font-semibold text-text uppercase text-[10px] tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              Cola de Aprobacion
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {approvalQueue.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle className="w-8 h-8 text-success/20 mx-auto mb-2" />
                <p className="text-xs text-text-dim italic">Todo bajo control</p>
              </div>
            ) : (
              approvalQueue.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-xl border border-border bg-surface-2 hover:border-warning/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedForApproval(item)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-text group-hover:text-warning transition-colors">{item.provider}</p>
                    <span className="text-[10px] font-bold text-warning">{formatCurrency(item.amount)}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mb-3 italic">"{item.concept}"</p>
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-1 rounded bg-success/10 text-success"><CheckCircle className="w-3.5 h-3.5" /></button>
                     <button className="p-1 rounded bg-danger/10 text-danger"><XCircle className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-danger/10">
                <Receipt className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text">Registrar Nuevo Gasto</h3>
                <p className="text-xs text-text-muted">Registro obligatorio sustentado en factura</p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Proveedor</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newExpense.provider}
                  onChange={(e) => setNewExpense({ ...newExpense, provider: e.target.value })}
                  placeholder="Ej: Amazon, Luz del Sur, Movistar..."
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-danger transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Monto (S/.)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-bold text-danger focus:outline-none focus:border-danger transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Numero de Factura</label>
                <input
                  type="text"
                  required
                  value={newExpense.invoiceNumber}
                  onChange={(e) => setNewExpense({ ...newExpense, invoiceNumber: e.target.value })}
                  placeholder="F001-XXXXXX"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-danger transition-colors"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Sustento / Concepto</label>
                <input
                  type="text"
                  required
                  value={newExpense.concept}
                  onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value })}
                  placeholder="Ej: Servidores Cloud, Pago Internet Abril..."
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-danger transition-colors"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Fuente de Financiamiento</label>
                <select
                  value={newExpense.fundSource}
                  onChange={(e) => setNewExpense({ ...newExpense, fundSource: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-danger transition-colors"
                >
                  <option value="operative">Fondo Operativo</option>
                  <option value="sunat">Fondo SUNAT (Impuestos)</option>
                  <option value="reserve">Fondo Reserva</option>
                </select>
              </div>
              
              <div className="col-span-2 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-lg transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-danger text-white hover:bg-danger/90 rounded-lg transition-colors text-sm font-medium shadow-lg shadow-danger/20"
                >
                  Registrar con Factura
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ApprovalDialog 
        expense={selectedForApproval}
        onApprove={handleApprove}
        onReject={(id) => { rejectExpense(id); setSelectedForApproval(null); }}
        onClose={() => setSelectedForApproval(null)}
      />
    </div>
  )
}
