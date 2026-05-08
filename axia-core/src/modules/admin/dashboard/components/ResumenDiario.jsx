import { motion } from 'framer-motion'
import { DollarSign, Users, ShieldCheck, Wallet } from 'lucide-react'
import { useTenantStore } from '@/store/useTenantStore'
import { formatCurrency } from '@/lib/utils'

export const ResumenDiario = () => {
  const { metrics } = useTenantStore()
  
  const cards = [
    { label: 'Ingresos Hoy', value: formatCurrency(metrics.dailyIncome), icon: DollarSign, color: 'text-turquoise' },
    { label: 'Clientes Activos', value: metrics.activeClients, icon: Users, color: 'text-white' },
    { label: 'Apartado SUNAT', value: formatCurrency(metrics.sunatApartado), icon: ShieldCheck, color: 'text-turquoise' },
    { label: 'Sueldo Acumulado', value: formatCurrency(metrics.cumulativeSalary), icon: Wallet, color: 'text-white' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-black border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:border-turquoise/50 transition-all group"
        >
          <div className="p-3 bg-white/5 rounded-xl group-hover:bg-turquoise/10 transition-colors">
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tighter text-white/50">{card.label}</p>
            <p className="text-xl font-bold text-white tracking-tight">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
