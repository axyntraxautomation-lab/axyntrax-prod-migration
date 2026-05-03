import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, PieChart, Wallet, ArrowDown } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DEFAULT_FUND_SPLIT } from '@/lib/constants'

export default function FinancePage() {
  const { incomes, funds, fundSplit, addIncome, updateFundSplit } = useFinanceStore()
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [newIncome, setNewIncome] = useState({ clientName: '', amount: '', concept: '' })

  const handleAddIncome = (e) => {
    e.preventDefault()
    if (!newIncome.clientName || !newIncome.amount) return
    addIncome(newIncome)
    setNewIncome({ clientName: '', amount: '', concept: '' })
    setShowAddIncome(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Flujo Financiero</h2>
          <p className="text-text-muted text-sm mt-1">Gestion de ingresos y distribucion de fondos</p>
        </div>
        <button
          onClick={() => setShowAddIncome(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Registrar Ingreso
        </button>
      </div>

      {/* Funds Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(funds).map(([name, amount], index) => {
          const labels = { operative: 'Fondo Operativo', sunat: 'Fondo SUNAT', reserve: 'Fondo Reserva', salary: 'Fondo Sueldo' }
          const colors = ['border-accent', 'border-success', 'border-warning', 'border-danger']
          return (
            <div key={name} className={`bg-surface border-l-4 ${colors[index]} rounded-xl p-5 shadow-sm`}>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{labels[name]}</p>
              <p className="text-2xl font-bold text-text">{formatCurrency(amount)}</p>
              <p className="text-[10px] text-text-dim mt-2">Distribucion actual: {fundSplit[name] * 100}%</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incomes */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-success" />
              Ingresos Recientes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Concepto</th>
                  <th className="px-6 py-3 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-text-dim italic">No hay ingresos registrados</td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-6 py-4 text-text-muted">{formatDate(income.date)}</td>
                      <td className="px-6 py-4 font-medium text-text">{income.clientName}</td>
                      <td className="px-6 py-4 text-text-muted">{income.concept}</td>
                      <td className="px-6 py-4 text-right font-bold text-success">{formatCurrency(income.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configuration / Distribution */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent" />
              Configuracion de Fondos
            </h3>
            <div className="space-y-4">
              {Object.entries(fundSplit).map(([name, value]) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted capitalize">{name}</span>
                    <span className="text-accent font-medium">{value * 100}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-text-dim italic mt-4">
                * Los porcentajes se aplican automaticamente en cada nuevo ingreso.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-text mb-6">Registrar Nuevo Ingreso</h3>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Cliente</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newIncome.clientName}
                  onChange={(e) => setNewIncome({ ...newIncome, clientName: e.target.value })}
                  placeholder="Nombre o Empresa"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Concepto</label>
                <input
                  type="text"
                  value={newIncome.concept}
                  onChange={(e) => setNewIncome({ ...newIncome, concept: e.target.value })}
                  placeholder="Servicio de IA / Consultoria"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Monto (S/.)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-bold text-success focus:outline-none focus:border-accent"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddIncome(false)}
                  className="flex-1 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-lg transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Confirmar Ingreso
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
