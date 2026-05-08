import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Sparkles, Send, Bot, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function BaseAxiaChat({ config }) {
  const [messages, setMessages] = useState([
    { role: 'axia', text: config?.axiaMessages?.greeting || 'Hola, soy AxyntraX. ¿En qué puedo ayudarte en este módulo?' }
  ])
  
  const [input, setInput] = useState('')

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', text: input }])
    setInput('')
    
    // Simular respuesta contextual
    setTimeout(() => {
      setMessages(m => [...m, { 
        role: 'axia', 
        text: `Entendido. Estoy procesando tu consulta sobre ${config.name} en el sector de ${config.sector}. ¿Deseas un reporte detallado?` 
      }])
    }, 800)
  }

  return (
    <div className="bg-black border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
           <Zap className="w-4 h-4 text-turquoise" style={{ color: config.primaryColor }} />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Asistente Contextual AxyntraX</span>
        </div>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.primaryColor }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: m.role === 'axia' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex flex-col max-w-[80%] rounded-2xl p-4 text-[11px] leading-relaxed",
              m.role === 'axia' ? "bg-white/5 border border-white/5 text-white/80 self-start" : "bg-white text-black font-bold self-end"
            )}
            style={m.role === 'axia' ? { borderLeft: `2px solid ${config.primaryColor}` } : { backgroundColor: config.primaryColor }}
          >
            {m.text}
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
         <input 
           type="text" 
           value={input}
           onChange={e => setInput(e.target.value)}
           placeholder="Consultar a la IA..."
           className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] uppercase font-bold text-white outline-none focus:border-white/20"
         />
         <button 
           type="submit"
           className="p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
           style={{ backgroundColor: config.primaryColor }}
         >
            <Send className="w-4 h-4 text-black" />
         </button>
      </form>
    </div>
  )
}
