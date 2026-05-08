import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSunatStore } from '@/store/useSunatStore'

export function ClientsMRR() {
  const receiptCount = useSunatStore((s) => s.getReceiptCount())
  const monthlyBilled = useSunatStore((s) => s.getMonthlyBilled())

  // Simulated trend data
  const trend = [
    { month: 'Ene', mrr: 2400 },
    { month: 'Feb', mrr: 3100 },
    { month: 'Mar', mrr: 2800 },
    { month: 'Abr', mrr: monthlyBilled || 3500 },
  ]

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">Clientes / MRR</h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-2.5 rounded-lg bg-accent/10">
          <Users className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold text-text">{receiptCount}</p>
          <p className="text-xs text-text-muted">Recibos este mes</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-bold text-success">{formatCurrency(monthlyBilled)}</p>
          <p className="text-xs text-text-muted">Facturado mensual</p>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer>
          <LineChart data={trend}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#55556a' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(val) => formatCurrency(val)}
              contentStyle={{ background: '#1a1a26', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#f1f1f4' }}
            />
            <Line type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
