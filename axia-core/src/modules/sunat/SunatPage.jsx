import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Plus, Search, Eye } from 'lucide-react'
import { useSunatStore } from '@/store/useSunatStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportReceiptPDF } from '@/lib/pdf'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default function SunatPage() {
  const { receipts, addReceipt } = useSunatStore()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [newReceipt, setNewReceipt] = useState({ clientName: '', clientRuc: '', concept: '', amount: '' })

  const handleAddReceipt = (e) => {
    e.preventDefault()
    if (!newReceipt.clientName || !newReceipt.amount) return
    addReceipt(newReceipt)
    setNewReceipt({ clientName: '', clientRuc: '', concept: '', amount: '' })
    setShowForm(false)
  }

  const filteredReceipts = receipts.filter(r => 
    r.clientName.toLowerCase().includes(search.toLowerCase()) || 
    r.number.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">SUNAT / Recibos</h2>
          <p className="text-text-muted text-sm mt-1">Gestion de Recibos por Honorarios electronicos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Emitir Recibo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Emitidos</p>
          <p className="text-2xl font-bold text-text">{receipts.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Facturado Historico</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(receipts.reduce((sum, r) => sum + Number(r.amount), 0))}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Ultima Emision</p>
          <p className="text-xl font-bold text-text">{receipts[0] ? formatDate(receipts[0].date) : '-'}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50 backdrop-blur-sm sticky top-0">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Registro de Comprobantes
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Buscar por cliente o numero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-text focus:outline-none focus:border-accent w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-text-muted uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-3 font-medium">Numero</th>
                <th className="px-6 py-3 font-medium">Fecha</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Monto</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-text-dim italic">No se encontraron comprobantes</td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-accent text-xs">{receipt.number}</td>
                    <td className="px-6 py-4 text-text-muted">{formatDate(receipt.date)}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{receipt.clientName}</p>
                      <p className="text-[10px] text-text-dim">{receipt.clientRuc}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-text">{formatCurrency(receipt.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={receipt.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => exportReceiptPDF(receipt)}
                          className="p-1.5 rounded-lg hover:bg-surface-3 text-text-muted hover:text-accent transition-all"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 rounded-lg hover:bg-surface-3 text-text-muted hover:text-text transition-all"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emission Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-accent/10">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text">Emitir Recibo por Honorarios</h3>
                <p className="text-xs text-text-muted">Complete los datos para generar el comprobante</p>
              </div>
            </div>

            <form onSubmit={handleAddReceipt} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Nombre o Razon Social del Cliente</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newReceipt.clientName}
                  onChange={(e) => setNewReceipt({ ...newReceipt, clientName: e.target.value })}
                  placeholder="Ej: AxyntraX S.A.C."
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">RUC del Cliente</label>
                <input
                  type="text"
                  value={newReceipt.clientRuc}
                  onChange={(e) => setNewReceipt({ ...newReceipt, clientRuc: e.target.value })}
                  placeholder="20XXXXXXXXX"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Monto del Servicio (S/.)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newReceipt.amount}
                  onChange={(e) => setNewReceipt({ ...newReceipt, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-bold text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs text-text-muted font-medium">Concepto o Descripcion</label>
                <textarea
                  required
                  rows="3"
                  value={newReceipt.concept}
                  onChange={(e) => setNewReceipt({ ...newReceipt, concept: e.target.value })}
                  placeholder="Descripcion detallada del servicio prestado..."
                  className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent transition-colors resize-none"
                />
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
                  className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Generar Comprobante
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
