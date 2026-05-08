import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, Languages } from 'lucide-react';
import { bus } from '@/lib/orchestrator/OrchestratorBus';
import { useI18nStore, t } from '@/lib/i18nStore';
import { IASalesConfig } from '../IASalesConfig';

export default function IASalesWeb() {
  const { language, setLanguage } = useI18nStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Inicializar mensajes según el idioma activo
  useEffect(() => {
    setMessages([{ 
      role: 'assistant', 
      text: t(IASalesConfig.flow.greeting, language) 
    }]);
  }, [language]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const response = t(IASalesConfig.flow.demo_ready, language);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);

      bus.emit({
        agente: 'IASalesWeb',
        evento: 'USER_QUERY',
        datos: { text: input, agent_reply: response },
        prioridad: 'media'
      });
    }, 1000);
  };

  return (
    <>
      {/* Botón flotante */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#8b5cf6] rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center text-white z-50 hover:scale-110 transition-all"
      >
        <MessageSquare className="w-8 h-8" />
      </button>

      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-28 right-8 w-[380px] h-[600px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-white" />
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter">AxiaVendor</h4>
               </div>
               <div className="flex items-center gap-3">
                  {/* Selector rápido de idioma */}
                  <button 
                    onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                     <X className="w-6 h-6" />
                  </button>
               </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {messages.map((m, i) => (
                 <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-[10px] font-bold uppercase tracking-tight",
                      m.role === 'user' ? "bg-white/10 text-white" : "bg-[#8b5cf6]/10 text-white border border-[#8b5cf6]/20"
                    )}>
                      {m.text}
                    </div>
                 </div>
               ))}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02]">
               <div className="flex items-center gap-3">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={language === 'es' ? "Escriba aquí..." : "Type here..."}
                    className="flex-1 bg-transparent border-none outline-none text-white text-[10px] font-bold uppercase placeholder:text-white/20"
                  />
                  <button onClick={handleSend} className="text-[#8b5cf6] hover:text-white transition-colors">
                     <Send className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
