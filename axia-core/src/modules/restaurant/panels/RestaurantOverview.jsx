import { motion } from 'framer-motion'
import { TrendingUp, Users, DollarSign, Utensils, Brain, AlertTriangle } from 'lucide-react'
import { useRestaurantStore } from '@/store/useRestaurantStore'
import { formatCurrency } from '@/lib/utils'

export default function RestaurantOverview() {
  const { menu, sales, tables, getAverageTicket } = useRestaurantStore()
  
  const occupiedCount = tables.filter(t => t.status === 'occupied').length
  const totalTables = tables.length
  const occupancyRate = ((occupiedCount / totalTables) * 100).toFixed(0)
  
  const todaySales = sales.filter(s => s.type !== 'shift_closure')
  const totalToday = todaySales.reduce((acc, s) => acc + Number(s.total), 0)
  
  const kpis = [
    { label: 'Ventas de Hoy', value: formatCurrency(totalToday), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Mesas Ocupadas', value: `${occupiedCount}/${totalTables}`, subtext: `${occupancyRate}% Ocupacion`, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Ticket Promedio', value: formatCurrency(getAverageTicket()), icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Plato Top', value: 'Lomo Saltado', subtext: '14 pedidos hoy', icon: Utensils, color: 'text-warning', bg: 'bg-warning/10' },
  ]

  const criticalStock = menu.filter(m => m.stock < 5)

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={kpi.label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{kpi.label}</span>
              <div className={cn('p-2 rounded-lg', kpi.bg)}>
                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-black', kpi.color)}>{kpi.value}</p>
            {kpi.subtext && <p className="text-[10px] text-text-dim mt-1">{kpi.subtext}</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Axia Restaurant Assistant */}
        <div className="lg:col-span-2 bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-xl">
              <Brain className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-text">Axia Restaurante: Analisis Proactivo</h3>
                <p className="text-sm text-text-muted">Optimizacion de salon e inventario en curso.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-surface-2/50 rounded-lg border border-border">
                  <p className="text-[10px] text-orange-400 font-bold uppercase mb-1">Recomendacion de Stock</p>
                  <p className="text-xs text-text-muted">"El stock de 'Ceviche Classico' es bajo (10). Dado el flujo de hoy, podria agotarse en 2 horas."</p>
                </div>
                <div className="p-3 bg-surface-2/50 rounded-lg border border-border">
                  <p className="text-[10px] text-accent font-bold uppercase mb-1">Tip de Rentabilidad</p>
                  <p className="text-xs text-text-muted">"El Lomo Saltado tiene un margen de 65%. Sugiero promocionarlo como plato del dia."</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Stock Widget */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Stock Critico
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {criticalStock.length === 0 ? (
              <p className="text-xs text-text-dim italic text-center py-10">Inventario estable</p>
            ) : (
              criticalStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/10">
                  <div>
                    <p className="text-xs font-bold text-text">{item.name}</p>
                    <p className="text-[10px] text-text-muted">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-warning">{item.stock}</p>
                    <p className="text-[8px] text-warning/60 uppercase font-black">Unidades</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/restaurant/stock" className="mt-6 text-center text-[10px] font-bold text-text-dim hover:text-orange-500 uppercase tracking-widest transition-colors">
            Ver Almacen Completo &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

import { Link } from 'react-router'
