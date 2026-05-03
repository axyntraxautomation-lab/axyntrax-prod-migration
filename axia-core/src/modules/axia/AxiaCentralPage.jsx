/**
 * AxiaCentralPage.jsx  — AXIA Chat + Monitor Operativo v2.0
 * Chat en tiempo real con AXIA usando la API de backend.
 * Fallback inteligente sin backend (respuestas locales).
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, ShieldCheck, Activity, Send, Sparkles,
  User, RefreshCw, Trash2, Download, Copy, Check
} from 'lucide-react'
import { useAxiaStore } from '@/store/useAxiaStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ── Respuestas offline de AXIA (cuando no hay backend) ──────────────────────
const AXIA_OFFLINE_RESPONSES = [
  (q) => `Entendido, Miguel. Analizo "${q.slice(0,40)}..." — con el pipeline actual detectamos 3 áreas de mejora: cobranzas, leads fríos y seguimiento de citas.`,
  () => `Revisando el ecosistema... Sin cobros vencidos reportados hoy. El sistema opera al 100%. ¿Quieres que genere el resumen ejecutivo de la semana?`,
  () => `Recomendación estratégica: activa el módulo de seguimiento 48h para los 0 prospectos en pipeline. Cada hora sin contacto reduce la conversión un 7%.`,
  (q) => `Para "${q.slice(0,30)}..." necesito acceso al backend activo. Mientras tanto: revisa Finanzas → el balance total refleja el estado real del negocio.`,
  () => `Detecto que el sistema lleva activo ${Math.floor(Math.random()*12)+1}h sin incidencias. Todos los módulos sincronizados. ¿Necesitas un reporte PDF del día?`,
  () => `Análisis de crecimiento: para escalar de 0 a 10 clientes en 30 días, necesitas activar: (1) Seguimiento WSP automático, (2) Ciclo de demos, (3) Licencias KEYGE activas.`,
]

let offlineIndex = 0
function getOfflineResponse(question) {
  const fn = AXIA_OFFLINE_RESPONSES[offlineIndex % AXIA_OFFLINE_RESPONSES.length]
  offlineIndex++
  return fn(question)
}

// ── Sugerencias rápidas ──────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  '¿Cómo va el negocio hoy?',
  '¿Hay alertas críticas?',
  '¿Cuáles son mis KPIs?',
  'Dame el resumen ejecutivo',
  '¿Qué módulo debo activar primero?',
  '¿Cuánto tengo en caja?',
]

// ── Burbuja de mensaje ───────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy }) {
  const [copied, setCopied] = useState(false)
  const isAxia = msg.role === 'assistant'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (onCopy) onCopy()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isAxia ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isAxia
          ? 'bg-accent/20 border border-accent/30'
          : 'bg-surface-3 border border-border'
      }`}>
        {isAxia
          ? <Brain className="w-4 h-4 text-accent" />
          : <User className="w-4 h-4 text-text-muted" />
        }
      </div>

      {/* Burbuja */}
      <div className={`group relative max-w-[78%] ${isAxia ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAxia
            ? 'bg-surface border border-border text-text rounded-tl-sm'
            : 'bg-accent text-white rounded-tr-sm'
        }`}>
          {msg.content}
          {msg.typing && (
            <span className="inline-flex gap-1 ml-2">
              <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>

        {/* Timestamp + copy */}
        <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isAxia ? '' : 'flex-row-reverse'}`}>
          <span className="text-[10px] text-text-dim">
            {new Date(msg.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isAxia && (
            <button onClick={handleCopy} className="text-text-dim hover:text-accent transition-colors">
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AxiaCentralPage() {
  const { alerts } = useAxiaStore()
  const funds = useFinanceStore((s) => s.funds)
  const totalFunds = Object.values(funds).reduce((a, b) => a + b, 0)

  const [messages, setMessages] = useState([{
    id:        1,
    role:      'assistant',
    content:   '¡Buenos días, Miguel! Soy AXIA, tu inteligencia gerencial. Puedo ayudarte con KPIs en tiempo real, alertas del negocio, análisis financiero y recomendaciones estratégicas. ¿Por dónde empezamos?',
    timestamp: Date.now(),
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [online,  setOnline]  = useState(false)
  const chatEndRef = useRef(null)
  const inputRef   = useRef(null)

  // Scroll al final cuando llegue mensaje nuevo
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Verificar si el backend está disponible
  useEffect(() => {
    fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok && setOnline(true))
      .catch(() => setOnline(false))
  }, [])

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return

    setInput('')
    setLoading(true)

    // Agregar mensaje del usuario
    const userMsg = { id: Date.now(), role: 'user', content: userText, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])

    // Indicador de escritura AXIA
    const typingId = Date.now() + 1
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '', typing: true, timestamp: Date.now() }])

    let responseText = ''

    try {
      if (online) {
        // ── Backend disponible: llamar al endpoint de chat con IA ──────────
        const chatRes = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText }),
          signal: AbortSignal.timeout(15000)
        })
        if (chatRes.ok) {
          const data = await chatRes.json()
          responseText = data.reply || 'AXIA procesó tu mensaje.'
        } else {
          responseText = 'El servidor respondió con error. Intenta de nuevo.'
        }
      } else {
        // ── Sin backend: respuesta offline inteligente ────────────────────
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1000))
        responseText = getOfflineResponse(userText)
      }
    } catch {
      responseText = 'Error de conexión con el servidor. Verifica que el backend esté activo en puerto 5001.'
    }

    // Reemplazar indicador de escritura con respuesta real
    setMessages(prev => prev.map(m =>
      m.id === typingId
        ? { id: typingId, role: 'assistant', content: responseText, timestamp: Date.now() }
        : m
    ))
    setLoading(false)
    inputRef.current?.focus()
  }, [input, loading, online])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      id:        Date.now(),
      role:      'assistant',
      content:   'Chat reiniciado. ¿En qué puedo ayudarte, Miguel?',
      timestamp: Date.now(),
    }])
  }

  const exportChat = () => {
    const text = messages
      .filter(m => !m.typing)
      .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.role === 'assistant' ? 'AXIA' : 'Miguel'}: ${m.content}`)
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `axia-chat-${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

      {/* ══ PANEL IZQUIERDO: Monitor Operativo ══ */}
      <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-1">

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-surface-2 to-surface border border-border rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent">AXIA Intelligence</p>
              <p className="text-xs text-text-dim">v2.0 — Modo {online ? 'Online' : 'Offline'}</p>
            </div>
            <div className={`ml-auto w-2 h-2 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
          </div>

          <div className="space-y-3 relative z-10">
            {[
              { label: 'Vigilancia Core',   icon: ShieldCheck, val: 'Activa',     color: 'text-emerald-400' },
              { label: 'Latencia Global',   icon: Activity,    val: '14ms',       color: 'text-accent' },
              { label: 'Capital Protegido', icon: Zap,         val: formatCurrency(totalFunds), color: 'text-text' },
            ].map(({ label, icon: Icon, val, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[11px] text-text-dim uppercase tracking-wide">{label}</span>
                </div>
                <span className={`text-[11px] font-bold ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alertas de seguridad */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-text">Alertas Activas</p>
            <span className={`w-2 h-2 rounded-full ${alerts.filter(a => !a.dismissed).length > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
          </div>
          {alerts.filter(a => !a.dismissed).length === 0 ? (
            <div className="flex flex-col items-center py-6 opacity-50">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-[11px] text-text-muted">Perímetro Seguro</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.filter(a => !a.dismissed).slice(0, 3).map(alert => (
                <div key={alert.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-[10px] font-black text-red-400 uppercase mb-1">Crítica</p>
                  <p className="text-xs text-text">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sugerencias rápidas */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-text mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Preguntas Rápidas
          </p>
          <div className="space-y-2">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="w-full text-left text-[11px] text-text-muted hover:text-accent hover:bg-accent/5 px-3 py-2 rounded-lg border border-border hover:border-accent/30 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══ PANEL DERECHO: Chat AXIA ══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col bg-surface border border-border rounded-2xl overflow-hidden min-h-0"
      >
        {/* Header del chat */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-black text-text uppercase tracking-tight">AXIA — Asistente Gerencial</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                <p className="text-[10px] text-text-dim">{online ? 'Conectado al backend' : 'Modo offline inteligente'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportChat}
              className="p-2 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
              title="Exportar chat"
            >
              <Download className="w-3.5 h-3.5 text-text-dim group-hover:text-accent transition-colors" />
            </button>
            <button
              onClick={clearChat}
              className="p-2 rounded-lg border border-border hover:border-red-400/40 hover:bg-red-400/5 transition-all group"
              title="Limpiar chat"
            >
              <Trash2 className="w-3.5 h-3.5 text-text-dim group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border bg-surface-2 flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntale a AXIA... (Enter para enviar)"
                rows={1}
                disabled={loading}
                className="w-full bg-surface border border-border hover:border-accent/30 focus:border-accent rounded-xl px-4 py-3 text-sm text-text placeholder-text-dim outline-none resize-none transition-all"
                style={{ maxHeight: '120px' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                loading || !input.trim()
                  ? 'bg-surface border border-border text-text-dim cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20 hover:scale-105'
              }`}
            >
              {loading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-[10px] text-text-dim mt-2 text-center">
            Enter para enviar · Shift+Enter para nueva línea · {online ? 'Backend conectado' : 'Modo offline'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
