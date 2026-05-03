import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { INTERNAL_API_URL } from '@/lib/constants'

const API_BASE = INTERNAL_API_URL

const QUICK_REPLIES = [
  { label: '💰 Ver precios', text: '¿Cuánto cuestan los planes?' },
  { label: '🏥 Módulo Clínica', text: 'Cuéntame sobre el módulo para clínicas' },
  { label: '⚖️ Módulo Legal', text: 'Información sobre el módulo legal' },
  { label: '🚀 Quiero una demo', text: 'Quiero ver una demo del sistema' },
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">A</div>
      <div className="bg-[#1a2235] border border-[rgba(0,212,212,0.15)] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              animate={{ y: [0,-4,0] }} transition={{ repeat:Infinity, duration:0.8, delay:i*0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`flex items-end gap-2 mb-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-bold text-black flex-shrink-0 mb-0.5">A</div>
      )}
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isBot
          ? 'bg-[#1a2235] border border-[rgba(0,212,212,0.12)] text-[#e2e8f0] rounded-bl-sm'
          : 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-black font-medium rounded-br-sm'
        }`}
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
        }}
      />
    </motion.div>
  )
}

export default function AxiaChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy **AXIA**, tu agente de automatización B2B. 🤖\n\n¿Cómo puedo ayudarte a transformar tu empresa hoy?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`axia_${Date.now()}`)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 200) }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Proactive greeting after 8s
  useEffect(() => {
    const t = setTimeout(() => {
      if (!open) setUnread(1)
    }, 8000)
    return () => clearTimeout(t)
  }, [open])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const resp = await fetch(`${API_BASE}/api/chat-web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: newMessages.slice(-10),
          sessionId
        })
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Disculpa, tuve un problema de conexión. ¿Puedes repetir tu consulta? 🙏'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="w-[360px] h-[520px] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            style={{ background: '#0d1420', border: '1px solid rgba(0,212,212,0.2)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0a1628] to-[#0d1b2e] px-4 py-3 flex items-center justify-between border-b border-[rgba(0,212,212,0.12)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center font-bold text-black">A</div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0a1628]" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">AXIA — Agente B2B</div>
                  <div className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    En línea ahora
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748b] hover:text-white transition-colors text-lg leading-none">×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 space-y-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,212,0.2) transparent' }}>
              {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map(q => (
                  <button key={q.label} onClick={() => send(q.text)}
                    className="text-[11px] px-2.5 py-1.5 rounded-xl border border-[rgba(0,212,212,0.2)] text-cyan-400 hover:bg-[rgba(0,212,212,0.08)] transition-colors whitespace-nowrap">
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex gap-2 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 focus-within:border-[rgba(0,212,212,0.4)] transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Escribe tu consulta..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#64748b] outline-none"
                />
                <button onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-black font-bold disabled:opacity-30 transition-opacity hover:from-cyan-400 flex-shrink-0">
                  ↑
                </button>
              </div>
              <div className="text-[10px] text-[#64748b] text-center mt-1.5">AXIA by AxyntraX Automation · 🧪 Modo Simulación</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #00d4d4, #00a8a8)' }}
      >
        <AnimatePresence mode="wait">
          <motion.span key={open ? 'x' : 'chat'} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            className="text-black font-bold text-xl select-none">{open ? '×' : '💬'}
          </motion.span>
        </AnimatePresence>
        {unread > 0 && !open && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0a0e1a]">
            {unread}
          </motion.div>
        )}
        {/* Ping animation */}
        {!open && (
          <motion.div className="absolute inset-0 rounded-full bg-cyan-400 opacity-30"
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }} />
        )}
      </motion.button>
    </div>
  )
}
