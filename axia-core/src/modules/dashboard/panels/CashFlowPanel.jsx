import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444']
const LABELS = { operative: 'Operativo', sunat: 'SUNAT', reserve: 'Reserva', salary: 'Sueldo' }

export function CashFlowPanel() {
  const funds = useFinanceStore((s) => s.funds)
  const total = Object.values(funds).reduce((a, b) => a + b, 0)

  const data = Object.entries(funds).map(([key, value]) => ({
    name: LABELS[key],
    value: Number(value.toFixed(2)),
  }))

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">Flujo de Fondos</h3>

      {total === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-dim text-sm">
          Sin movimientos registrados
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-40 h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ background: '#1a1a26', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f1f1f4' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-text-muted">{d.name}</span>
                </div>
                <span className="text-text font-medium">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
