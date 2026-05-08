import { formatDate } from './utils'

export function exportCSV(title, columns, rows, filename) {
  const now = new Date()
  const header = columns.join(',')
  const body = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${formatDate(now, 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
