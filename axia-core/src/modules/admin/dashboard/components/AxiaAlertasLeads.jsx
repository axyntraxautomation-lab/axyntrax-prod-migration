import { motion } from 'framer-motion'
import { Bell, Clock, UserCheck, AlertCircle } from 'lucide-react'
import { useLeadStore } from '@/store/useLeadStore'

export const AxiaAlertasLeads = () => {
  const { leads, newCount } = useLeadStore()
  
  // Calcular leads sin responder (> 24h)
  const noResponse = leads.filter(l => l.status === 'nuevo').length
  const readyToActivate = leads.filter(l => l.status === 'demo' || l.status === 'contactado').length

  const alerts = [
    { label: 'Leads Nuevos', count: newCount, icon: Bell, color: 'text-turquoise' },
    { label: 'Sin Responder', count: noResponse, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Listos para Activar', count: readyToActivate, icon: UserCheck, color: 'text-turquoise' },
  ]

  return (
    <div className="bg-black border border-white/10 rounded-3xl p-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Alertas Axia</h3>
      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-turquoise/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <alert.icon className={`w-4 h-4 ${alert.color}`} />
              </div>
              <span className="text-[11px] font-bold text-white/80 uppercase">{alert.label}</span>
            </div>
            <span className="text-sm font-black text-white">{alert.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
