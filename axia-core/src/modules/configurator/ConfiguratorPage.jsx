import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Check, Download, FileText, ShoppingCart, 
  Trash2, ArrowRight, ShieldCheck, Zap
} from 'lucide-react'
import { getRegisteredModules } from '@/lib/engine/registry'
import { useSalesStore } from '@/store/useSalesStore'
import { formatCurrency, cn } from '@/lib/utils'
import { exportTablePDF } from '@/lib/pdf'

export default function ConfiguratorPage() {
  const [clientName, setClientName] = useState('')
  const modules = getRegisteredModules()
  const { 
    selectedModuleId, 
    selectedSubModules, 
    selectModule, 
    toggleSubModule, 
    calculateTotal,
    generateQuote 
  } = useSalesStore()

  const currentConfig = modules.find(m => m.id === selectedModuleId)
  const total = calculateTotal()

  const handleGenerateQuote = () => {
    if (!clientName || !selectedModuleId) return
    const quote = generateQuote(clientName)
    
    // Generate PDF
    const columns = ['Modulo/Seccion', 'Concepto', 'Costo Mensual']
    const rows = [
      [currentConfig.name, 'Licencia Base', formatCurrency(currentConfig.pricing.base)],
      ...selectedSubModules.map(sm => [sm, 'Modulo Adicional', formatCurrency(currentConfig.pricing.perModule)])
    ]
    
    exportTablePDF(
      `Cotizacion Axia - ${clientName}`, 
      columns, 
      rows, 
      `cotizacion_${clientName.replace(/\s/g, '_').toLowerCase()}`
    )
    alert(`Cotizacion ${quote.id} generada con exito.`)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-text uppercase tracking-tighter">Configurador Axia Suite</h2>
          <p className="text-text-muted mt-1">Arme la suite empresarial a medida de su necesidad</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-2 border border-border px-6 py-4 rounded-2xl">
          <div className="text-right">
            <p className="text-[10px] text-text-dim uppercase font-black tracking-widest leading-none mb-1">Inversion Mensual</p>
            <p className="text-3xl font-black text-accent tracking-tighter leading-none">{formatCurrency(total)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Rubro Selection */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface border border-border rounded-3xl p-8 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-8">
                <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-black">1</span>
                <h3 className="text-sm font-black text-text uppercase tracking-widest">Seleccionar Rubro Principal</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectModule(m.id)}
                    className={cn(
                      'p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group',
                      selectedModuleId === m.id 
                        ? 'bg-accent/5 border-accent shadow-xl shadow-accent/10' 
                        : 'bg-surface-2 border-border hover:border-border-hover'
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                       <div 
                         className={cn(
                           'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                           selectedModuleId === m.id ? 'bg-accent text-white' : 'bg-surface-3 text-text-muted'
                         )}
                         style={selectedModuleId === m.id ? { backgroundColor: m.primaryColor } : {}}
                       >
                         <m.icon className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-bold text-text truncate uppercase text-sm tracking-tight">{m.name}</p>
                          <p className="text-[10px] text-text-dim uppercase font-bold">{m.sector}</p>
                       </div>
                    </div>
                    {selectedModuleId === m.id && (
                       <motion.div layoutId="check-active" className="absolute top-4 right-4">
                          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white">
                             <Check className="w-3.5 h-3.5" />
                          </div>
                       </motion.div>
                    )}
                  </button>
                ))}
             </div>
          </div>

          {/* Step 2: Sub-modules Selection */}
          <AnimatePresence mode="wait">
            {currentConfig ? (
              <motion.div
                key={selectedModuleId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface border border-border rounded-3xl p-8"
              >
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-black">2</span>
                  <h3 className="text-sm font-black text-text uppercase tracking-widest">Personalizar Modulos de {currentConfig.name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {currentConfig.sections?.map((sec) => (
                      <button
                        key={sec.label}
                        onClick={() => toggleSubModule(sec.label)}
                        className={cn(
                          'p-4 rounded-xl border flex items-center justify-between transition-all group',
                          selectedSubModules.includes(sec.label)
                            ? 'bg-accent/10 border-accent/40'
                            : 'bg-surface-2 border-border hover:bg-surface-3'
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              selectedSubModules.includes(sec.label) ? 'bg-accent text-white' : 'bg-surface-3 text-text-dim'
                            )}>
                               <sec.icon className="w-4 h-4" />
                            </div>
                            <span className={cn('text-xs font-bold uppercase tracking-tight', selectedSubModules.includes(sec.label) ? 'text-text' : 'text-text-muted')}>
                               {sec.label}
                            </span>
                         </div>
                         <div className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                            selectedSubModules.includes(sec.label) ? 'bg-accent border-accent text-white' : 'border-border'
                         )}>
                            {selectedSubModules.includes(sec.label) && <Check className="w-3 h-3" />}
                         </div>
                      </button>
                   ))}
                </div>
              </motion.div>
            ) : (
                <div className="p-20 text-center border-2 border-dashed border-border rounded-3xl text-text-dim italic text-sm">
                   Seleccione un rubro para configurar sus submódulos
                </div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 3: Checkout / Quote Generation */}
        <div className="space-y-6">
           <div className="bg-surface border border-border rounded-3xl p-8 sticky top-6">
              <h3 className="text-sm font-black text-text uppercase tracking-widest mb-8">Resumen de Cotizacion</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-text-muted uppercase font-bold tracking-tight">Licencia Base</span>
                   <span className="text-text font-black">{currentConfig ? formatCurrency(currentConfig.pricing.base) : formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-text-muted uppercase font-bold tracking-tight">Modulos Adicionales ({selectedSubModules.length})</span>
                   <span className="text-text font-black">{currentConfig ? formatCurrency(selectedSubModules.length * currentConfig.pricing.perModule) : formatCurrency(0)}</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-end">
                   <div>
                      <p className="text-[10px] text-accent uppercase font-black tracking-widest mb-1">Total Mensual</p>
                      <p className="text-4xl font-black text-text tracking-tighter">{formatCurrency(total)}</p>
                   </div>
                   <Zap className="w-8 h-8 text-warning animate-pulse mb-1" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-text-dim pl-1">Nombre del Cliente</label>
                   <input 
                      type="text"
                      placeholder="Ej: Clinica San Pablo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent transition-all"
                   />
                </div>
                <button 
                  onClick={handleGenerateQuote}
                  disabled={!clientName || !selectedModuleId}
                  className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-30"
                >
                   <FileText className="w-4 h-4" />
                   Generar Cotizacion PDF
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-border space-y-4">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-success" />
                    <p className="text-[10px] text-text-muted leading-tight">Garantía de implementación en 48hs hábiles tras aprobación.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
