import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, Sparkles, RefreshCcw, UserCircle2 } from 'lucide-react';
import { askDeepSeek } from '@/lib/agents/deepseek/client';

type Message = { role: 'system' | 'user' | 'assistant'; content: string; isFallback?: boolean };

export default function CeciliaSection({ isCompact = false }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Cecilia Asist, tu asesora neural de AXYNTRAX. ¿Cómo te llamas?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'thinking' | 'waiting'>('online');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setStatus('thinking');

    try {
      const response = await askDeepSeek([
        { role: 'system', content: 'Eres Cecilia, la asistente neural de AXYNTRAX. Sé breve, amable y profesional.' },
        ...messages,
        { role: 'user', content: userMsg }
      ]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setStatus('online');
    } catch (error) {
      console.error('Cecilia Latency:', error);
      // ESTADO DE ESPERA ELEGANTE EN LUGAR DE ERROR
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Estoy revisando tu consulta ahora mismo. Un instante, ya te ayudo.',
        isFallback: true 
      }]);
      setStatus('waiting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${isCompact ? 'max-w-md' : 'max-w-xl'} mx-auto`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0A0A0F] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-black"
      >
        {/* HEADER CON INDICADOR DE VIDA */}
        <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] flex items-center justify-center">
                <Bot size={20} className="text-black" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0A0F] animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight">Cecilia Asist</h3>
              <p className="text-[10px] text-[#00D4FF] font-black uppercase tracking-widest">En línea</p>
            </div>
          </div>
          <Sparkles size={16} className="text-white/20" />
        </div>

        {/* CHAT AREA */}
        <div 
          ref={scrollRef}
          className="h-[350px] overflow-y-auto p-6 space-y-4 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                msg.role === 'user' 
                ? 'bg-[#00D4FF] text-black rounded-tr-none' 
                : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'
              }`}>
                {msg.content}
                {/* @ts-ignore */}
                {msg.isFallback && (
                  <button 
                    onClick={handleSend}
                    className="mt-3 flex items-center gap-2 text-[10px] font-black text-[#00D4FF] uppercase hover:underline"
                  >
                    <RefreshCcw size={10} /> Reintentar ahora
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="relative flex items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu consulta..."
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00D4FF]/50 transition-all"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 p-3 bg-[#00D4FF] text-black rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-3 flex justify-center">
            <button className="text-[9px] text-slate-600 uppercase font-black tracking-widest hover:text-slate-400 transition-all flex items-center gap-2">
              <UserCircle2 size={12} /> Preferir atención humana
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
