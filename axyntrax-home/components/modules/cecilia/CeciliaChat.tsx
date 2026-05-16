'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

export default function CeciliaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Cecilia, tu orquestadora de AXYNTRAX. ¿Cómo puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/cecilia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, perdí conexión temporal con mi núcleo neural.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] h-[500px] bg-[#0A0A0F] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#00D4FF]/20 to-[#7B2FFF]/20 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="/images/cecilia_avatar_portrait_1778799212096.png" 
                    alt="Cecilia Avatar" 
                    className="w-12 h-12 rounded-full border-2 border-[#00D4FF] object-cover shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-bold">Cecilia AI</p>
                  <p className="text-[10px] text-[#00D4FF] animate-pulse uppercase tracking-widest font-mono">En línea // Orquestando</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#00D4FF] text-black font-medium' 
                      : 'bg-white/5 border border-white/10 text-slate-300'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-[10px] text-[#00D4FF] font-mono animate-pulse">
                    CECILIA ESTÁ PENSANDO...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-black/50 border-t border-white/5 flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#00D4FF] transition-all"
              />
              <button type="submit" className="w-10 h-10 bg-[#00D4FF] rounded-xl flex items-center justify-center text-black hover:scale-105 transition-all">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full shadow-[0_0_30px_rgba(0,212,255,0.4)] flex items-center justify-center relative overflow-hidden group border-2 border-[#00D4FF]/50 p-0"
      >
        <img 
          src="/images/cecilia_avatar_portrait_1778799212096.png" 
          alt="Chat Cecilia" 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-[#00D4FF]/10 group-hover:bg-transparent transition-colors" />
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-[#0A0A0F] rounded-full" />
      </motion.button>
    </div>
  );
}
