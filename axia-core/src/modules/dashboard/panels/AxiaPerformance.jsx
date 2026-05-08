import { Brain, Zap, ShieldCheck, Activity } from 'lucide-react'
import { useAxiaStore } from '@/store/useAxiaStore'

export function AxiaPerformance() {
  const alerts = useAxiaStore((s) => s.alerts).filter(a => !a.dismissed)

  const stats = [
    { label: 'Uptime', value: '100%', icon: Activity, color: 'text-success' },
    { label: 'Optimizaciones', value: '12', icon: Zap, color: 'text-accent' },
    { label: 'Seguridad', value: 'Activa', icon: ShieldCheck, color: 'text-warning' },
  ]

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Performance Axia</h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-3 rounded-lg bg-surface-2">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-lg font-bold text-text">{stat.value}</p>
            <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <h4 className="text-xs font-semibold text-text-dim uppercase mb-3">Ultimas Alertas</h4>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-text-dim text-center py-4">Sistema operando bajo parametros normales</p>
          ) : (
            alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex gap-3 text-sm p-2 rounded hover:bg-surface-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                <p className="text-text-muted">{alert.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
