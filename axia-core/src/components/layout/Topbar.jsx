import { Bell, Search } from 'lucide-react'
import { useAxiaStore } from '@/store/useAxiaStore'
import { OWNER_NAME } from '@/lib/constants'

export function Topbar() {
  const alertCount = useAxiaStore((s) => s.getActiveAlerts().length)

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 w-72 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-surface-2 transition-colors">
          <Bell className="w-5 h-5 text-text-muted" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
            M
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-text leading-none">{OWNER_NAME}</p>
            <p className="text-[11px] text-text-dim">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  )
}
