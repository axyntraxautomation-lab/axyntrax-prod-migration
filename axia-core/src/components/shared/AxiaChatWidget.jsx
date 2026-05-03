import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Command, Sparkles, Bot } from 'lucide-react'
import { useLeadStore } from '@/store/useLeadStore'
import { useFinanzaStore } from '@/store/useFinanzaStore'
import { useAxiaStore } from '@/store/useAxiaStore'
import { formatCurrency } from '@/lib/utils'

export const AxiaChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [chat, setChat] = useState([
    { role: 'axia', message: 'Hola Miguel, soy Axia. ¿Qué necesitas saber sobre la operación hoy?' }
  ])
  const scrollRef = useRef(null)

  const { leads } = useLeadStore()
  const { funds, getMonthlyIncomes } = useFinanzaStore()
  const { metrics } = useAxiaStore()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chat])

  const handleSend = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    const userMsg = query.trim().toLowerCase()
    setChat(s => [...s, { role: 'user', message: query }])
    setQuery('')

    // Lógica de respuesta simulada (IA local)
    setTimeout(() => {
      let response = "Interesante pregunta. Déjame analizar los datos..."
      
      if (userMsg.includes('leads') || userMsg.includes('prospectos')) {
        response = `Actualmente tenemos ${leads.length} leads en el sistema, de los cuales ${leads.filter(l => l.status === 'nuevo').length} son nuevos hoy.`
      } else if (userMsg.includes('caja') || userMsg.includes('fondos') || userMsg.includes('dinero')) {
        response = `El flujo de caja está saludable. El total en fondos es de ${formatCurrency(Object.values(funds).reduce((a,b) => a+b, 0))}. El ingreso mensual acumulado es ${formatCurrency(getMonthlyIncomes())}.`
      } else if (userMsg.includes('axia') || userMsg.includes('performance')) {
        response = `Mi red neuronal está operando al ${metrics.systemQuality}%. Hoy he tomado ${metrics.metrics?.decisionsToday || 0} decisiones operativas.`
      } else if (userMsg.includes('hola') || userMsg.includes('ayuda')) {
        response = "Puedes preguntarme sobre leads, estado de caja, gastos pendientes o la performance de los bots."
      }

      setChat(s => [...s, { role: 'axia', message: response }])
    }, 600)
  }

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[380px] h-[500px] bg-black border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-turquoise/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-turquoise" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-widest">Axia Voice</h4>
                  <p className="text-[10px] text-turquoise font-bold uppercase">Maestro Operativo</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
              {chat.map((c, i) => (
                <div key={i} className={cn("flex flex-col", c.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed",
                    c.role === 'user' ? "bg-turquoise text-black font-bold" : "bg-white/5 border border-white/5 text-white/80"
                  )}>
                    {c.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Pregunta sobre el negocio..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-turquoise transition-all"
              />
              <button 
                type="submit"
                className="p-3 bg-turquoise text-black rounded-xl hover:bg-white transition-all shadow-lg shadow-turquoise/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-turquoise rounded-full flex items-center justify-center shadow-2xl shadow-turquoise/30 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare className="w-7 h-7 text-black relative z-10" />
        <AnimatePresence>
           {!isOpen && (
             <motion.div 
               initial={{ opacity: 0, scale: 0 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute -top-1 -right-1 w-5 h-5 bg-white border-4 border-black rounded-full"
             />
           )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
