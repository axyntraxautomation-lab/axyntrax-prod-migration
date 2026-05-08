import { useExpenseStore } from '@/store/useExpenseStore'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, truncate } from '@/lib/utils'

export function PendingExpenses() {
  const approvalQueue = useExpenseStore((s) => s.approvalQueue)

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Gastos por Aprobar</h3>
        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
          {approvalQueue.length} pendientes
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {approvalQueue.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-dim text-sm h-full">
            No hay gastos pendientes
          </div>
        ) : (
          <div className="space-y-3">
            {approvalQueue.slice(0, 4).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-2 transition-colors">
                <div>
                  <p className="font-medium text-text text-sm">{truncate(expense.provider, 20)}</p>
                  <p className="text-xs text-text-muted">{truncate(expense.concept, 25)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-warning text-sm">{formatCurrency(expense.amount)}</p>
                  <StatusBadge status="pending_approval" className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
