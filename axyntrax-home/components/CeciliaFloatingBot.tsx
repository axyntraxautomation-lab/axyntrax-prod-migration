"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, User, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface Message {
  role: 'bot' | 'user';
  text: string;
}

export function CeciliaFloatingBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '¡Hola! Soy **Cecilia Asist**, tu asesora experta en AXYNTRAX 🚀.\n\nAntes de empezar, ¿cómo te llamas? 😊' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setShowTooltip(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isMounted) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: "Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías repetirlo?" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error de conexión. Por favor verifica tu internet." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="mb-4 mr-2 bg-white px-4 py-2 rounded-2xl rounded-br-none shadow-2xl border border-[#00D4FF]/20 flex items-center gap-3 cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#00D4FF]/20 shadow-lg">
              <Image src="/cecilia-avatar.png" alt="Cecilia" width={32} height={32} className="object-cover" />
            </div>
            <p className="text-[11px] font-bold text-black uppercase tracking-tight">
              ¿Hablamos de tu <span className="text-[#00D4FF]">Negocio</span>?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isOpen ? 'bg-[#1A1A2E] text-white rotate-90' : 'bg-gradient-to-tr from-[#00D4FF] to-[#7B2FFF] text-white'}`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold animate-bounce">
            1
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] rounded-[32px] bg-[#0A0A0F] border border-white/10 shadow-[0_20px_100px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#00D4FF]/10 to-[#7B2FFF]/10 border-b border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#00D4FF]/40 shadow-xl">
                <Image src="/cecilia-avatar.png" alt="Cecilia" width={48} height={48} className="object-cover" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Cecilia Asist</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">En línea ahora</span>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide bg-[#020204]/50"
            >
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#00D4FF] text-black font-medium rounded-tr-sm' 
                      : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm'
                  }`}>
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <Loader2 size={16} className="text-[#00D4FF] animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/5">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu consulta aquí..."
                  className="w-full h-12 bg-black border border-white/10 rounded-xl px-4 pr-12 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all placeholder:text-slate-600"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 w-8 h-8 rounded-lg bg-[#00D4FF] text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-center text-[9px] text-slate-600 mt-3 font-medium uppercase tracking-widest">Powered by Axyntrax Automation</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
