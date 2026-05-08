import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { Calculator, FileText, Send, Save, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ProformasQuirurgicas() {
  const { config } = useOutletContext()
  const [items, setItems] = useState([
    { id: 1, concept: 'Derecho de Sala de Operaciones', amount: 1500 },
    { id: 2, concept: 'Honorarios Cirujano Principal', amount: 3500 },
    { id: 3, concept: 'Honorarios Anestesiólogo', amount: 1200 },
  ])

  const total = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Presupuestos Quirúrgicos</h2>
        
        <div className="bg-black border border-white/10 rounded-3xl p-8 space-y-6">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Calculadora de Proformas</span>
              <button className="flex items-center gap-2 text-xs font-black text-turquoise hover:text-white transition-colors">
                 <Plus className="w-4 h-4" /> Agregar Item
              </button>
           </div>

           <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex-1">
                      <p className="text-xs font-bold text-white uppercase leading-none">{item.concept}</p>
                   </div>
                   <span className="text-xs text-white/60 font-mono">{formatCurrency(item.amount)}</span>
                </div>
              ))}
           </div>

           <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm font-black text-white/40 uppercase">Total Estimado</span>
              <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
           </div>
        </div>
      </div>

      <div className="space-y-6">
         <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-full">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-8">Acciones de Emisión</h3>
            <div className="space-y-4">
               <button className="w-full flex items-center justify-between p-6 bg-black border border-white/10 rounded-2xl hover:border-turquoise transition-all group">
                  <div className="flex items-center gap-4 text-left">
                     <FileText className="w-6 h-6 text-white/20 group-hover:text-turquoise" />
                     <div>
                        <p className="text-xs font-black uppercase text-white">Generar PDF</p>
                        <p className="text-[9px] text-white/40 font-bold uppercase mt-1">Logo Clinica & Firma</p>
                     </div>
                  </div>
                  <Save className="w-4 h-4 text-white/10" />
               </button>

               <button className="w-full flex items-center justify-between p-6 bg-black border border-white/10 rounded-2xl hover:border-turquoise transition-all group">
                  <div className="flex items-center gap-4 text-left">
                     <Send className="w-6 h-6 text-white/20 group-hover:text-turquoise" />
                     <div>
                        <p className="text-xs font-black uppercase text-white">Enviar a Paciente</p>
                        <p className="text-[9px] text-white/40 font-bold uppercase mt-1">Via WhatsApp / Email</p>
                     </div>
                  </div>
                  <Send className="w-4 h-4 text-white/10" />
               </button>
            </div>

            <div className="mt-12 p-6 bg-turquoise/5 border border-turquoise/20 rounded-3xl">
               <div className="flex items-center gap-3 mb-2">
                  <Calculator className="w-4 h-4 text-turquoise" />
                  <span className="text-[10px] font-black uppercase text-turquoise">Analisis Axia</span>
               </div>
               <p className="text-[11px] text-white/60 leading-relaxed italic">
                  "Este presupuesto tiene un margen de rentabilidad del 42%. Sugiero incluir un 5% adicional por variación de insumos importados."
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}
