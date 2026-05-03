/**
 * AdminPage.jsx — Panel de Administración AXYNTRAX
 * Control total del sistema: servicios, .env, usuarios, API keys, deploy
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Server, Key, Wifi, WifiOff, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Settings, Database, Globe, Zap,
  Copy, Check, Eye, EyeOff, Terminal
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      ok === true  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
      ok === false ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                     'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
    }`}>
      {ok === true ? <CheckCircle2 className="w-3 h-3" /> :
       ok === false ? <XCircle className="w-3 h-3" /> :
       <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  )
}

// ── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ icon: Icon, name, port, description, status, detail }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            status ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <Icon className={`w-4 h-4 ${status ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-text">{name}</p>
            <p className="text-[10px] text-text-dim">Puerto {port}</p>
          </div>
        </div>
        <StatusBadge ok={status} label={status ? 'Online' : 'Offline'} />
      </div>
      <p className="text-[11px] text-text-muted mb-2">{description}</p>
      {detail && <p className="text-[10px] text-text-dim font-mono bg-surface-2 px-2 py-1 rounded-lg">{detail}</p>}
    </motion.div>
  )
}

// ── Config Row ───────────────────────────────────────────────────────────────
function ConfigRow({ label, value, isSecret = false, status }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const display = isSecret ? (visible ? value : value ? '••••••••••••' : '(vacío — sin configurar)') : value

  const copy = () => {
    if (value) {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-dim font-mono w-48 truncate">{label}</span>
        <StatusBadge ok={value ? true : false} label={value ? 'Configurado' : 'Falta'} />
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-mono ${value ? 'text-text' : 'text-red-400'} max-w-[200px] truncate`}>
          {display}
        </span>
        {isSecret && value && (
          <button onClick={() => setVisible(!visible)} className="text-text-dim hover:text-accent transition-colors">
            {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
        {value && (
          <button onClick={copy} className="text-text-dim hover:text-accent transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [health, setHealth]       = useState(null)
  const [ceciliaOk, setCeciliaOk] = useState(null)
  const [reactOk, setReactOk]     = useState(true)  // Si estás aquí, React está corriendo
  const [checking, setChecking]   = useState(false)
  const [logs, setLogs]           = useState([])

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString('es-PE'), msg, type }, ...prev].slice(0, 20))
  }

  const checkServices = async () => {
    setChecking(true)
    addLog('Iniciando chequeo de servicios...', 'info')

    // API 5001
    try {
      const r = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) })
      const data = await r.json()
      setHealth(data)
      addLog(`API REST: ${data.status} | WhatsApp: ${data.whatsapp ? 'OK' : 'Sin tokens'} | v${data.version}`, data.status === 'operational' ? 'success' : 'warn')
    } catch {
      setHealth(null)
      addLog('API REST (5001): OFFLINE — ejecuta python axia_api.py', 'error')
    }

    // CECILIA 5000
    try {
      const r = await fetch('http://localhost:5000/health', { signal: AbortSignal.timeout(4000) })
      const data = await r.json()
      setCeciliaOk(data.status === 'operational')
      addLog(`CECILIA: ${data.status} | Firebase: ${data.firebase ? 'OK' : 'Local'} | WSP: ${data.whatsapp ? 'OK' : 'Sin tokens'}`, 'success')
    } catch {
      setCeciliaOk(false)
      addLog('CECILIA (5000): OFFLINE — ejecuta python axia_webhook.py', 'error')
    }

    addLog('Chequeo completado', 'info')
    setChecking(false)
  }

  useEffect(() => { checkServices() }, [])

  const envConfig = [
    { label: 'ADMIN_PHONE_NUMBER',    value: '51991740590',                    secret: false },
    { label: 'WSP_ACCESS_TOKEN',      value: '',                               secret: true  },
    { label: 'WSP_PHONE_NUMBER_ID',   value: '',                               secret: true  },
    { label: 'WH_VERIFY_TOKEN',       value: 'axyntrax_diamante_2026',         secret: false },
    { label: 'GEMINI_API_KEY',        value: '',                               secret: true  },
    { label: 'OPENAI_API_KEY',        value: '',                               secret: true  },
    { label: 'EMAIL_CORPORATIVO',     value: 'axyntraxautomation@gmail.com',   secret: false },
    { label: 'EMPRESA_NOMBRE',        value: 'AXYNTRAX AUTOMATION',            secret: false },
    { label: 'EMPRESA_PROPIETARIO',   value: 'Miguel Montero',                 secret: false },
    { label: 'EMPRESA_RUC',          value: '',                               secret: false },
    { label: 'DOMINIO_WEB',          value: 'axyntrax-automation.com',        secret: false },
    { label: 'NETLIFY_SITE_ID',      value: 'c23272e4-33e7-4724-be53-dcb7b9421134', secret: false },
  ]

  const pendingCount = envConfig.filter(c => !c.value).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-text uppercase tracking-tight">Panel de Administración</h1>
              <p className="text-xs text-text-dim">Control total del ecosistema AXYNTRAX</p>
            </div>
          </div>
        </div>
        <button
          onClick={checkServices}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Verificando...' : 'Verificar Todo'}
        </button>
      </motion.div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-300">{pendingCount} credenciales sin configurar</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">
              Para activar IA real (Gemini) y WhatsApp (CECILIA), configura las API keys en el archivo{' '}
              <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded font-mono text-[10px]">.env</code>{' '}
              del proyecto y reinicia los servicios.
            </p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {!envConfig.find(c => c.label === 'GEMINI_API_KEY')?.value && (
                <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                   className="text-[10px] bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-2.5 py-1 rounded-lg transition-colors font-bold">
                  → Obtener GEMINI_API_KEY (gratis)
                </a>
              )}
              {!envConfig.find(c => c.label === 'WSP_ACCESS_TOKEN')?.value && (
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer"
                   className="text-[10px] bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-2.5 py-1 rounded-lg transition-colors font-bold">
                  → Obtener WSP_ACCESS_TOKEN (Meta)
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Servicios ── */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-dim flex items-center gap-2">
            <Server className="w-3.5 h-3.5" />
            Estado de Servicios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ServiceCard
              icon={health ? Wifi : WifiOff}
              name="AXIA API REST"
              port={5001}
              description="KPIs, Chat, Licencias, QR. Servido por Flask."
              status={!!health}
              detail={health ? `v${health.version} — ${health.timestamp?.slice(11,19)}` : 'python axia_api.py'}
            />
            <ServiceCard
              icon={health?.whatsapp ? Zap : WifiOff}
              name="CECILIA Webhook"
              port={5000}
              description="Bot WhatsApp 24/7. Recibe y responde mensajes."
              status={ceciliaOk}
              detail={ceciliaOk === null ? 'Verificando...' : ceciliaOk ? 'Operativa' : 'python axia_webhook.py'}
            />
            <ServiceCard
              icon={Globe}
              name="Dashboard React"
              port={5173}
              description="Frontend local dev server. Vite + React."
              status={reactOk}
              detail="npm run dev (axia-core)"
            />
          </div>

          {/* Producción */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-text">Producción — Netlify</h3>
              <StatusBadge ok={true} label="Live" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'URL Principal', value: 'axyntrax-automation.com', href: 'https://axyntrax-automation.com' },
                { label: 'URL con WWW',   value: 'www.axyntrax-automation.com', href: 'https://www.axyntrax-automation.com' },
                { label: 'Netlify URL',  value: 'phenomenal-semolina-58a73c.netlify.app', href: 'https://phenomenal-semolina-58a73c.netlify.app' },
                { label: 'Dashboard',    value: 'Netlify Control Panel', href: 'https://app.netlify.com/projects/phenomenal-semolina-58a73c' },
              ].map(({ label, value, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer"
                   className="block p-3 bg-surface-2 rounded-xl border border-border hover:border-accent/30 transition-all group">
                  <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-[11px] text-accent group-hover:underline font-mono truncate">{value}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Terminal de logs */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-text">Log de Diagnóstico</h3>
            </div>
            <div className="bg-[#0a0a0f] rounded-xl p-4 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-text-dim">Sin registros aún...</p>
              ) : logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-text-dim shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error'   ? 'text-red-400' :
                    log.type === 'warn'    ? 'text-yellow-400' :
                    'text-text-muted'
                  }>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Configuración .env ── */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-text-dim flex items-center gap-2">
            <Key className="w-3.5 h-3.5" />
            Variables de Entorno (.env)
          </h2>
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-text">Configuración del sistema</p>
              <span className={`text-[10px] font-bold ${pendingCount > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {envConfig.length - pendingCount}/{envConfig.length} OK
              </span>
            </div>
            <div className="space-y-0.5">
              {envConfig.map(({ label, value, secret }) => (
                <ConfigRow key={label} label={label} value={value} isSecret={secret} />
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface-2 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1">Para configurar:</p>
              <code className="text-[10px] text-accent font-mono">
                Editar: AXYNTRAX_AUTOMATION_Suite\.env
              </code>
              <p className="text-[9px] text-text-dim mt-1">Reinicia axia_api.py y axia_webhook.py después de cambiar</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-3 flex items-center gap-2">
              <Settings className="w-3 h-3" />
              Acciones Rápidas
            </p>
            <div className="space-y-2">
              {[
                { label: '🔑 Obtener Gemini API Key', href: 'https://aistudio.google.com' },
                { label: '📱 Meta Developers (WhatsApp)', href: 'https://developers.facebook.com/apps' },
                { label: '🔥 Firebase Console', href: 'https://console.firebase.google.com' },
                { label: '🌐 Netlify Dashboard', href: 'https://app.netlify.com/projects/phenomenal-semolina-58a73c' },
                { label: '📊 Netlify Analytics', href: 'https://app.netlify.com/projects/phenomenal-semolina-58a73c/analytics' },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer"
                   className="flex items-center gap-2 w-full text-left text-[11px] text-text-muted hover:text-accent hover:bg-accent/5 px-3 py-2 rounded-lg border border-border hover:border-accent/30 transition-all">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
