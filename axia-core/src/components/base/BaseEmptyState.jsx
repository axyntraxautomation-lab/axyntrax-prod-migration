import { Inbox } from 'lucide-react'

export function BaseEmptyState({ title = 'Sin datos', message = 'No se encontraron registros en esta seccion.', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-50">
      <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center">
        <Icon className="w-8 h-8 text-text-dim" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-text uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-text-muted mt-1 max-w-[200px] mx-auto">{message}</p>
      </div>
    </div>
  )
}
