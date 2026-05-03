import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Briefcase, History, Send } from 'lucide-react'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { formatCurrency } from '@/lib/utils'

export const SueldoMiguel = () => {
  const { funds, withdrawals, withdrawSalary } = useFinanzaStore()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const handleWithdrawal = (e) => {
    e.preventDefault()
    if (!amount) return
    const success = withdrawSalary(amount, note)
    if (success) {
      setAmount('')
      setNote('')
    } else {
      alert('Fondos insuficientes en la cuenta de sueldo')
    }
  }

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-turquoise/20 border border-turquoise/30 flex items-center justify-center overflow-hidden">
           <User className="w-8 h-8 text-turquoise" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Miguel Montero</h3>
          <p className="text-[10px] font-bold text-turquoise uppercase">CEO & Arca Maestro</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
           <span className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Disponible para Retiro</span>
           <p className="text-3xl font-black text-white">{formatCurrency(funds.salary)}</p>
        </div>

        <form onSubmit={handleWithdrawal} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
             <input 
               type="number" 
               placeholder="Monto S/."
               value={amount}
               onChange={e => setAmount(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-turquoise outline-none"
             />
             <input 
               type="text" 
               placeholder="Concepto (opcional)"
               value={note}
               onChange={e => setNote(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-turquoise outline-none"
             />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-turquoise transition-all flex items-center justify-center gap-2"
          >
            Realizar Retiro <Send className="w-3 h-3" />
          </button>
        </form>

        <div className="pt-6 border-t border-white/5">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4 flex items-center gap-2">
            <History className="w-3 h-3" /> Historial de Retiros
          </h4>
          <div className="space-y-3">
            {withdrawals.slice(0, 5).map((w) => (
              <div key={w.id} className="flex justify-between items-center text-[10px]">
                <div>
                   <p className="font-bold text-white/80">{w.note || 'Retiro de Sueldo'}</p>
                   <p className="text-white/30">{new Date(w.date).toLocaleDateString()}</p>
                </div>
                <span className="text-white font-black">- {formatCurrency(w.amount)}</span>
              </div>
            ))}
            {withdrawals.length === 0 && (
              <p className="text-center text-[10px] text-white/20 italic">No hay retiros registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
