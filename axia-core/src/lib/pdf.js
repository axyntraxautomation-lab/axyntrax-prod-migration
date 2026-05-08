import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { APP_NAME, OWNER_NAME } from './constants'
import { formatDate, formatCurrency } from './utils'

export function exportTablePDF(title, columns, rows, filename) {
  const doc = new jsPDF()
  const now = new Date()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(99, 102, 241)
  doc.text(APP_NAME, 14, 20)
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 140)
  doc.text(`${title} | ${formatDate(now)} | ${OWNER_NAME}`, 14, 28)

  // Table
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 60] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  })

  doc.save(`${filename}_${formatDate(now, 'yyyy-MM-dd')}.pdf`)
}

export function exportReceiptPDF(receipt) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(99, 102, 241)
  doc.text('RECIBO POR HONORARIOS', 14, 25)

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 90)
  doc.text(`Serie: ${receipt.series}`, 14, 35)
  doc.text(`Numero: ${receipt.number}`, 14, 42)
  doc.text(`Fecha: ${formatDate(receipt.date)}`, 14, 49)

  doc.setDrawColor(99, 102, 241)
  doc.line(14, 55, 196, 55)

  doc.setFontSize(11)
  doc.text(`Cliente: ${receipt.clientName}`, 14, 65)
  doc.text(`RUC: ${receipt.clientRuc}`, 14, 72)
  doc.text(`Concepto: ${receipt.concept}`, 14, 79)

  doc.setFontSize(16)
  doc.setTextColor(34, 197, 94)
  doc.text(`MONTO: ${formatCurrency(receipt.amount)}`, 14, 95)

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 140)
  doc.text(`Emitido por: ${OWNER_NAME} | ${APP_NAME} v1.0`, 14, 280)

  doc.save(`${receipt.series}-${receipt.number}.pdf`)
}
