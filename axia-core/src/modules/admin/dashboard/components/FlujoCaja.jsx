import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTenantStore } from '@/store/useTenantStore'
import { formatCurrency } from '@/lib/utils'

export const FlujoCaja = () => {
  const { funds } = useTenantStore()
  
  const data = [
    { name: 'Operativo', value: funds.operative, color: '#00CED1' },
    { name: 'SUNAT', value: funds.sunat, color: '#FFFFFF' },
    { name: 'Reserva', value: funds.reserve, color: '#333333' },
    { name: 'Miguel', value: funds.miguel, color: '#008B8B' },
  ]

  const total = Object.values(funds).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-8 h-full">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full md:w-1/2 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-turquoise mb-4">Fondos de Capital</h3>
          {data.map((fund, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fund.color }} />
                <span className="text-xs font-bold text-white/70 uppercase tracking-tight">{fund.name}</span>
              </div>
              <span className="text-xs font-black text-white group-hover:text-turquoise transition-colors">
                {formatCurrency(fund.value)}
              </span>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-white/40">Total Consolidado</span>
            <span className="text-lg font-black text-white">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
