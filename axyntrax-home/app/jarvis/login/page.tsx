'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, Terminal, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function JarvisLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jarvis/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/jarvis/panel');
      } else {
        setError(data.message || 'ACCESO DENEGADO');
        setLoading(false);
      }
    } catch (err) {
      setError('ERROR DE COMUNICACIÓN NEURAL');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#050507]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 border border-[#00D4FF]/20 bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(0,212,255,0.1)]"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size={180} light />
          <p className="text-[10px] font-mono text-slate-500 mt-4 uppercase tracking-widest">Protocolo de Acceso CEO Miguel Montero</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={12} /> Usuario Neural
            </label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-[#00D4FF]/20 rounded-lg px-4 py-3 text-sm font-mono focus:border-[#00D4FF] outline-none transition-all placeholder:text-slate-700"
              placeholder="root_user"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Clave de Encriptación
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-[#00D4FF]/20 rounded-lg px-4 py-3 text-sm font-mono focus:border-[#00D4FF] outline-none transition-all placeholder:text-slate-700"
              placeholder="********"
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded text-[10px] font-mono text-red-400 text-center"
            >
              &gt; {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#00D4FF]/10 border border-[#00D4FF] text-[#00D4FF] font-mono font-bold text-xs tracking-[0.3em] hover:bg-[#00D4FF] hover:text-black transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          >
            {loading ? 'DESENCRIPTANDO...' : 'INICIAR SESIÓN NEURAL'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#00D4FF]/10 text-center">
          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
            Advertencia: El acceso no autorizado es monitoreado por ATLAS y reportado al CEO.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
