/**
 * AxiaDailySummary — Widget AXIA de resumen ejecutivo 24h
 * Se conecta al backend Python /api/dashboard/brief + /api/dashboard/alerts
 * Fallback local si backend no está disponible.
 */
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Zap, RefreshCw, TrendingUp } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ── Colores por prioridad ────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  ALTA:  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    icon: AlertTriangle },
  MEDIA: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: AlertTriangle },
  BAJA:  { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   icon: CheckCircle  },
}

// ── Alert Badge ──────────────────────────────────────────────────────────────
function AlertBadge({ alert }) {
  const style = PRIORITY_STYLE[alert.prioridad] || PRIORITY_STYLE.BAJA
  const Icon  = style.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${style.bg} ${style.border}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.text}`} />
      <div className="min-w-0">
        <p className={`text-xs font-bold ${style.text} uppercase tracking-wide`}>
          {alert.tipo?.replace(/_/g, ' ')}
        </p>
        <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{alert.mensaje}</p>
        {alert.accion && (
          <p className="text-[10px] text-text-dim mt-1 italic">→ {alert.accion}</p>
        )}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${style.bg} ${style.text} border ${style.border} flex-shrink-0`}>
        {alert.prioridad}
      </span>
    </motion.div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export function AxiaDailySummary() {
  const [brief,   setBrief]   = useState('')
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [briefRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/brief`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${API_BASE}/api/dashboard/alerts`, { signal: AbortSignal.timeout(5000) }),
      ])

      if (briefRes.ok) {
        const d = await briefRes.json()
        if (d.ok) setBrief(d.brief)
      }
      if (alertsRes.ok) {
        const d = await alertsRes.json()
        if (d.ok) setAlerts(d.alerts || [])
      }
    } catch {
      // Backend no disponible — usar datos demo
      setBrief('🕐 Sistema AXIA activo. Conecta el backend para ver métricas reales.')
      setAlerts([{
        tipo: 'SISTEMA', prioridad: 'BAJA',
        mensaje: 'Backend desconectado. Ejecuta: python axia_api.py',
        accion: 'Correr en terminal: python axia_api.py'
      }])
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [])

  // Cargar al montar + refrescar cada 5 minutos
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const criticalCount = alerts.filter(a => a.prioridad === 'ALTA').length

  return (
    <div className="space-y-4">
      {/* ── Barra de alertas críticas (sticky visual) ── */}
      <AnimatePresence>
        {criticalCount > 0 && (
          <motion.div
            key="critical-bar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <p className="text-xs font-black text-red-400 uppercase tracking-widest">
              🚨 {criticalCount} Alerta{criticalCount > 1 ? 's' : ''} Crítica{criticalCount > 1 ? 's' : ''} — Acción Requerida
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Widget principal AXIA Brief ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-surface-2 via-surface to-surface-3 border border-border rounded-3xl p-6 relative overflow-hidden"
      >
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent">AXIA Intelligence</p>
              <p className="text-xs text-text-dim">Resumen Ejecutivo Diario</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
            title="Actualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-text-dim group-hover:text-accent transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Brief Text */}
        <div className="relative z-10 mb-6">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-surface-3 rounded-lg animate-pulse w-3/4" />
              <div className="h-4 bg-surface-3 rounded-lg animate-pulse w-1/2" />
            </div>
          ) : (
            <motion.p
              key={brief}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-text leading-relaxed font-medium"
            >
              {brief || 'Sistema AXIA inicializando...'}
            </motion.p>
          )}
          <p className="text-[10px] text-text-dim mt-2">
            Actualizado: {lastRefresh.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="relative z-10 space-y-2">
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3 h-3" />
              Incidencias Activas ({alerts.length})
            </p>
            {alerts.slice(0, 4).map((alert, i) => (
              <AlertBadge key={i} alert={alert} />
            ))}
            {alerts.length > 4 && (
              <p className="text-[10px] text-text-dim text-center pt-1">
                +{alerts.length - 4} alertas más...
              </p>
            )}
          </div>
        )}

        {/* Sin alertas */}
        {!loading && alerts.length === 0 && (
          <div className="relative z-10 flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-400 font-bold">Sin alertas críticas — Sistema operativo al 100%</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
