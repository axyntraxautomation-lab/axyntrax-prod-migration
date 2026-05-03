import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calculator, ArrowUpRight } from 'lucide-react'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { formatCurrency } from '@/lib/utils'

export const CobrosMensuales = () => {
  const { addIncome, getMonthlyIncomes } = useFinanzaStore()
  const [isAdding, setIsAdding] = useState(false)
  
  const [form, setForm] = useState({
    amount: '',
    plan: 'Base',
    includeIGV: false,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount) return
    
    const amount = Number(form.amount)
    const igv = form.includeIGV ? amount * 0.18 : 0
    
    addIncome({
      amount: amount + igv,
      plan: form.plan,
      igv,
    })
    
    setIsAdding(false)
    setForm({ amount: '', plan: 'Base', includeIGV: false })
  }

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-8 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-turquoise">Cobros Mensuales</h3>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(getMonthlyIncomes())}</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-3 bg-white text-black rounded-2xl hover:bg-turquoise transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 mb-8 p-6 bg-white/5 rounded-2xl border border-white/10"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-white/40">Monto Base</label>
              <input 
                type="number"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-turquoise"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-white/40">Plan</label>
              <select 
                value={form.plan}
                onChange={e => setForm({...form, plan: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-turquoise appearance-none"
              >
                <option>Base</option>
                <option>Professional</option>
                <option>Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox"
              checked={form.includeIGV}
              onChange={e => setForm({...form, includeIGV: e.target.checked})}
              className="w-4 h-4 accent-turquoise"
            />
            <span className="text-xs text-white/60">Agregar IGV (18%)</span>
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-turquoise text-black font-black uppercase text-xs rounded-xl hover:bg-white transition-all shadow-lg shadow-turquoise/20"
          >
            Registrar Cobro y Distribuir Fondos
          </button>
        </motion.form>
      )}

      {/* Mini historial */}
      <div className="space-y-3">
        <h4 className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4">Ultimos Registros</h4>
        {[].slice(0, 3).map((_, i) => (
           <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 text-[11px]">
             <span className="text-white/60">Venta Plan Enterprise</span>
             <span className="text-turquoise font-bold">+ S/. 1,500.00</span>
           </div>
        ))}
      </div>
    </div>
  )
}
