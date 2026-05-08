/**
 * LoginPage.jsx — Pantalla de inicio de sesion AXYNTRAX
 * Permite login con email/password, registro del primer usuario,
 * y guarda el token de sesion en localStorage.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Mail, Lock, Eye, EyeOff, Loader2, UserPlus, LogIn, Shield, AlertCircle } from 'lucide-react'
import { BACKEND_URL } from '@/lib/constants'

const API_BASE = BACKEND_URL

export default function LoginPage({ onLogin }) {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre]     = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [checking, setChecking] = useState(true)
  const [hasUsers, setHasUsers] = useState(true)

  // Al cargar: verificar si hay usuarios registrados (si no, modo registro)
  useEffect(() => {
    const token = localStorage.getItem('axia_session_token')
    if (token) {
      // Verificar si el token sigue válido
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'X-Auth-Token': token },
        signal: AbortSignal.timeout(5000)
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            onLogin(data.user, token)
          } else {
            localStorage.removeItem('axia_session_token')
            setChecking(false)
          }
        })
        .catch(() => setChecking(false))
    } else {
      // Verificar si existe algún usuario en el sistema
      fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(4000) })
        .then(() => {
          // Intentar detectar si es primer acceso comprobando el endpoint de usuarios
          // Si la API responde pero no hay usuarios → modo registro automático
          setChecking(false)
        })
        .catch(() => setChecking(false))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { nombre, email, password, rol: 'master' }

      const res  = await fetch(`${API_BASE}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(10000)
      })
      const data = await res.json()

      if (data.ok) {
        localStorage.setItem('axia_session_token', data.token)
        localStorage.setItem('axia_user', JSON.stringify(data.user))
        onLogin(data.user, data.token)
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (err) {
      if (err.name === 'TimeoutError') {
        setError('El servidor central de AxyntraX no responde. Verifique su conexión o intente más tarde.')
      } else {
        setError('Error de comunicación con el núcleo AXIA. Verifique disponibilidad del servicio.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Brain className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <p className="text-text-dim text-sm">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-2xl shadow-accent/30 mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-black text-text tracking-tight uppercase">AXIA Command Center</h1>
          <p className="text-sm text-text-dim mt-1">AXYNTRAX Automation Suite</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl shadow-black/20">
          {/* Tab selector */}
          <div className="flex gap-1 p-1 bg-surface-2 rounded-xl mb-6">
            {[
              { id: 'login',    label: 'Iniciar Sesión', icon: LogIn },
              { id: 'register', label: 'Crear Cuenta',   icon: UserPlus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setError('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === id
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="nombre"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Miguel Montero"
                    required={mode === 'register'}
                    className="w-full bg-surface-2 border border-border hover:border-accent/30 focus:border-accent rounded-xl px-4 py-3 text-sm text-text placeholder-text-dim outline-none transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full bg-surface-2 border border-border hover:border-accent/30 focus:border-accent rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder-text-dim outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  required
                  minLength={mode === 'register' ? 6 : 1}
                  className="w-full bg-surface-2 border border-border hover:border-accent/30 focus:border-accent rounded-xl pl-10 pr-12 py-3 text-sm text-text placeholder-text-dim outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-accent-hover hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <><LogIn className="w-4 h-4" /> Entrar al Sistema</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Crear Cuenta</>
              )}
            </button>

            {/* Demo Button */}
            <div className="relative pt-4">
               <div className="absolute inset-x-0 top-6 h-px bg-border" />
               <div className="relative flex justify-center text-[10px] font-black text-text-dim uppercase tracking-widest bg-surface px-4 w-fit mx-auto mb-4">O bien</div>
               
               <button
                 type="button"
                 onClick={() => {
                   const guest = { id: 'guest', nombre: 'Visitante Demo', email: 'demo@axyntrax.com', rol: 'demo' }
                   localStorage.setItem('axia_user', JSON.stringify(guest))
                   localStorage.setItem('axia_session_token', 'demo_token_123')
                   onLogin(guest, 'demo_token_123')
                 }}
                 className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-text font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
               >
                 <Brain className="w-4 h-4 text-accent group-hover:animate-pulse" />
                 Iniciar en Modo Demo
               </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-3 bg-surface-2 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                {mode === 'register' ? 'Primera cuenta = Master Admin' : 'Acceso protegido'}
              </span>
            </div>
            <p className="text-[10px] text-text-dim">
              {mode === 'register'
                ? 'El primer usuario registrado obtiene acceso master. Luego puedes crear operadores desde el Panel Admin.'
                : 'Tus credenciales son seguras. Sesión expira en 8 horas de inactividad.'}
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-dim mt-6 opacity-50">
          AXYNTRAX Automation Suite v3.0 — Lima, Perú
        </p>
      </motion.div>
    </div>
  )
}
