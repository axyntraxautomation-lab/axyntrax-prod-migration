import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useExpenseStore } from '@/store/useExpenseStore'
import { formatCurrency } from '@/lib/utils'

export function DailySummary() {
  const todayIncome = useFinanceStore((s) => s.getTodayIncome())
  const totalIncome = useFinanceStore((s) => s.getTotalIncome())
  const todayExpenses = useExpenseStore((s) => s.getTodayExpenses())
  const totalExpenses = useExpenseStore((s) => s.getTotalExpenses())
  const pendingCount = useExpenseStore((s) => s.getPendingCount())

  const cards = [
    { label: 'Ingresos Hoy', value: formatCurrency(todayIncome), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Gastos Hoy', value: formatCurrency(todayExpenses), icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10' },
    { label: 'Balance Total', value: formatCurrency(totalIncome - totalExpenses), icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Aprobaciones Pendientes', value: String(pendingCount), icon: ArrowUpRight, color: 'text-warning', bg: 'bg-warning/10' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted uppercase tracking-wide">{card.label}</span>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
