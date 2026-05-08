/**
 * ProtectedRoute.jsx v3.0 — Auth con backend real
 * Verifica sesion en /api/auth/me, muestra LoginPage si no autenticado.
 */
import { useEffect, useState } from 'react'
import { Brain, Loader2 } from 'lucide-react'
import LoginPage from '@/modules/auth/LoginPage'
import { BACKEND_URL } from '@/lib/constants'

const API_BASE = BACKEND_URL

export function ProtectedRoute({ children }) {
  const [state, setState] = useState('checking') // 'checking' | 'auth' | 'unauth'
  const [user, setUser]   = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('axia_session_token')
    if (!token) {
      setState('unauth')
      return
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'X-Auth-Token': token },
      signal:  AbortSignal.timeout(5000)
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setUser(data.user)
          setState('auth')
        } else {
          localStorage.removeItem('axia_session_token')
          setState('unauth')
        }
      })
      .catch(() => {
        // Si el backend no responde, verificar si tiene credenciales guardadas localmente
        const savedUser = localStorage.getItem('axia_user')
        if (savedUser && token) {
          // Modo offline: usar datos cacheados
          setUser(JSON.parse(savedUser))
          setState('auth')
        } else {
          setState('unauth')
        }
      })
  }, [])

  const handleLogin = (userData, token) => {
    setUser(userData)
    setState('auth')
  }

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
          <Brain className="w-7 h-7 text-accent animate-pulse" />
        </div>
        <p className="text-text-dim text-sm">Verificando acceso...</p>
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
      </div>
    )
  }

  if (state === 'unauth') {
    return <LoginPage onLogin={handleLogin} />
  }

  // Inyectar user en el contexto de la app
  return children
}
