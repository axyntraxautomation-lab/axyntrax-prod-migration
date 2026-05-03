import { cn } from '@/lib/utils'

export function BaseSkeleton({ className }) {
  return (
    <div className={cn("animate-pulse bg-surface-2 rounded-xl", className)} />
  )
}

export function BaseModuleSkeleton() {
  return (
    <div className="space-y-6">
      <BaseSkeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseSkeleton className="h-32" />
        <BaseSkeleton className="h-32" />
        <BaseSkeleton className="h-32" />
        <BaseSkeleton className="h-32" />
      </div>
      <BaseSkeleton className="h-96 w-full" />
    </div>
  )
}
