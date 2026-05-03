import { cn } from '@/lib/utils'

export function SkeletonCard({ className }) {
  return (
    <div className={cn('bg-surface rounded-xl p-6 animate-pulse', className)}>
      <div className="h-3 w-24 bg-border rounded mb-4" />
      <div className="h-8 w-32 bg-border rounded mb-2" />
      <div className="h-2 w-16 bg-border/50 rounded" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn('bg-surface rounded-xl p-4 animate-pulse', className)}>
      <div className="flex gap-4 mb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 bg-border rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 mb-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 flex-1 bg-border/50 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}
