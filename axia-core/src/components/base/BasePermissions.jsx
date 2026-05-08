import { Shield, Lock } from 'lucide-react'

/**
 * Access Control Component for internal module features.
 * Integrates with the module config and tenant permissions.
 */
export default function BasePermissions({ requiredRole, children, fallback = null }) {
  // Logic to be expanded when multi-user roles are added
  const hasAccess = true // Default for Master Admin Miguel

  if (!hasAccess) {
    return fallback || (
      <div className="p-10 border border-border bg-surface-2/30 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text uppercase mb-1">Acceso Denegado</h3>
          <p className="text-xs text-text-muted">No cuenta con permisos para ver esta seccion.</p>
        </div>
      </div>
    )
  }

  return children
}
