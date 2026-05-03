import { motion } from 'framer-motion'
import { Wallet, ShieldCheck, Landmark, PiggyBank } from 'lucide-react'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { formatCurrency } from '@/lib/utils'

export const FlujoCaja = () => {
  const { funds } = useFinanzaStore()
  
  const fundList = [
    { name: 'Operativo', value: funds.operative, icon: Wallet, color: 'text-turquoise', bg: 'bg-turquoise/10' },
    { name: 'SUNAT', value: funds.sunat, icon: ShieldCheck, color: 'text-white', bg: 'bg-white/5' },
    { name: 'Reserva', value: funds.reserve, icon: Landmark, color: 'text-turquoise', bg: 'bg-turquoise/10' },
    { name: 'Sueldo Miguel', value: funds.salary, icon: PiggyBank, color: 'text-white', bg: 'bg-white/5' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {fundList.map((fund, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-black border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-turquoise/50 transition-all"
        >
          <div className={cn("absolute right-[-10px] top-[-10px] opacity-5 group-hover:opacity-10 transition-opacity", fund.color)}>
             <fund.icon className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${fund.bg} ${fund.color}`}>
              <fund.icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{fund.name}</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(fund.value)}</p>
        </motion.div>
      ))}
    </div>
  )
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}
