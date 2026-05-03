import { useState } from 'react'
import { BarChart3, Download, FileText, Table as TableIcon, Calendar } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useExpenseStore } from '@/store/useExpenseStore'
import { useSunatStore } from '@/store/useSunatStore'
import { useSalaryStore } from '@/store/useSalaryStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportTablePDF } from '@/lib/pdf'
import { exportCSV } from '@/lib/csv'
import { REPORT_PERIODS } from '@/lib/constants'

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly')
  
  const incomes = useFinanceStore((s) => s.incomes)
  const expenses = useExpenseStore((s) => s.expenses)
  const receipts = useSunatStore((s) => s.receipts)
  const withdrawals = useSalaryStore((s) => s.withdrawals)

  const handleExportPDF = () => {
    const columns = ['Tipo', 'Fecha', 'Concepto', 'Monto']
    const rows = [
      ...incomes.map(i => ['Ingreso', formatDate(i.date), i.clientName, formatCurrency(i.amount)]),
      ...expenses.map(e => ['Gasto', formatDate(e.date), e.provider, formatCurrency(e.amount)]),
      ...withdrawals.map(w => ['Sueldo', formatDate(w.date), w.note || 'Retiro', formatCurrency(w.amount)])
    ]
    exportTablePDF(`Reporte Financiero - ${period}`, columns, rows, `reporte_axia_${period}`)
  }

  const handleExportCSV = () => {
    const columns = ['Tipo', 'Fecha', 'Concepto', 'Monto']
    const rows = [
      ...incomes.map(i => ['Ingreso', formatDate(i.date), i.clientName, i.amount]),
      ...expenses.map(e => ['Gasto', formatDate(e.date), e.provider, e.amount]),
      ...withdrawals.map(w => ['Sueldo', formatDate(w.date), w.note || 'Retiro', w.amount])
    ]
    exportCSV(`Reporte Financiero - ${period}`, columns, rows, `reporte_axia_${period}`)
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Centro de Reportes</h2>
          <p className="text-text-muted text-sm mt-1">Exportacion de datos contables y financieros</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text rounded-lg transition-colors text-sm font-medium border border-border"
          >
            <TableIcon className="w-4 h-4 text-success" />
            Excel / CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Reporte PDF
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-6 mb-8">
            <div className="flex p-1 bg-surface-2 border border-border rounded-lg">
                {REPORT_PERIODS.map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                            period === p ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-dim hover:text-text'
                        }`}
                    >
                        {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : 'Mensual'}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 text-text-dim">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Periodo actual: {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-4">
                <p className="text-[10px] text-text-dim uppercase font-black tracking-widest">Ingresos Totales</p>
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-success">{formatCurrency(incomes.reduce((s, i) => s + Number(i.amount), 0))}</span>
                    <BarChart3 className="w-8 h-8 text-success/20" />
                </div>
            </div>
            <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-4">
                <p className="text-[10px] text-text-dim uppercase font-black tracking-widest">Egresos Totales</p>
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-danger">{formatCurrency(expenses.reduce((s, e) => s + Number(e.amount), 0))}</span>
                    <BarChart3 className="w-8 h-8 text-danger/20" />
                </div>
            </div>
            <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-4">
                <p className="text-[10px] text-text-dim uppercase font-black tracking-widest">Recibos Emitidos</p>
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-accent">{receipts.length}</span>
                    <FileText className="w-8 h-8 text-accent/20" />
                </div>
            </div>
            <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-4">
                <p className="text-[10px] text-text-dim uppercase font-black tracking-widest">Retiro de Sueldo</p>
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-text">{formatCurrency(withdrawals.reduce((s, w) => s + w.amount, 0))}</span>
                    <Download className="w-8 h-8 text-text-dim/20" />
                </div>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="text-sm font-bold text-text uppercase tracking-widest mb-4">Vista Previa de Datos de Exportacion</h3>
            <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Concepto</th>
                            <th className="px-6 py-3 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {incomes.slice(0, 3).map(i => (
                            <tr key={i.id} className="text-xs">
                                <td className="px-6 py-3 text-success font-bold">Ingreso</td>
                                <td className="px-6 py-3 text-text-muted">{formatDate(i.date)}</td>
                                <td className="px-6 py-3 text-text">{i.clientName}</td>
                                <td className="px-6 py-3 text-right font-bold text-text">{formatCurrency(i.amount)}</td>
                            </tr>
                        ))}
                         {expenses.slice(0, 3).map(e => (
                            <tr key={e.id} className="text-xs">
                                <td className="px-6 py-3 text-danger font-bold">Gasto</td>
                                <td className="px-6 py-3 text-text-muted">{formatDate(e.date)}</td>
                                <td className="px-6 py-3 text-text">{e.provider}</td>
                                <td className="px-6 py-3 text-right font-bold text-text">{formatCurrency(e.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-surface-2/50 text-center border-t border-border">
                    <p className="text-[10px] text-text-dim italic">Muestra limitada. Use los botones de exportacion para ver el reporte completo.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
