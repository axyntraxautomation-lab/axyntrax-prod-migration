import { cn } from '@/lib/utils'

const variants = {
  approved: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  pending_approval: 'bg-warning/10 text-warning border-warning/20',
  rejected: 'bg-danger/10 text-danger border-danger/20',
  emitted: 'bg-accent/10 text-accent border-accent/20',
  active: 'bg-success/10 text-success border-success/20',
}

const labels = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  pending_approval: 'Requiere Aprobacion',
  rejected: 'Rechazado',
  emitted: 'Emitido',
  active: 'Activo',
}

export function StatusBadge({ status, className }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[status] || 'bg-surface-2 text-text-muted', className)}>
      {labels[status] || status}
    </span>
  )
}
