'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { validateKey } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [email, setEmail] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const keyStatus = validateKey(key);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (keyStatus.type === 'INVALID') {
      setError('La KEY ingresada no es válida. Verifique los 40 caracteres.');
      setLoading(false);
      return;
    }

    // Simulate Auth
    setTimeout(() => {
      localStorage.setItem('axyntrax_session', JSON.stringify({ email, type: keyStatus.type }));
      router.push('/configuracion');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
      >
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Bienvenido a la Suite</h2>
        <p className="text-slate-500 text-center text-sm mb-8">Ingrese sus credenciales de acceso Axyntrax</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#00D4FF] mb-2 uppercase tracking-widest">Email Corporativo</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00D4FF] outline-none transition-all"
              placeholder="admin@empresa.com"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-mono text-[#00D4FF] mb-2 uppercase tracking-widest">Licencia (KEY 40 Dig)</label>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:border-[#00D4FF] outline-none transition-all font-mono text-sm"
                placeholder="AX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                required
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {keyStatus.type !== 'INVALID' && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  keyStatus.type === 'DEMO' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {keyStatus.type === 'DEMO' ? 'DEMO 30 DÍAS' : 'LICENCIA FULL'}
                </span>
                <ShieldCheck size={12} className={keyStatus.type === 'DEMO' ? 'text-orange-400' : 'text-green-400'} />
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#00D4FF] text-black font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              'ACCEDER AL SISTEMA'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
          <a 
            href="https://wa.me/51991740590" 
            target="_blank" 
            className="flex items-center gap-2 text-slate-400 hover:text-[#00D4FF] text-xs transition-colors"
          >
            <HelpCircle size={14} /> Soporte Técnico CEO JARVIS
          </a>
          <button 
            onClick={() => router.push('/registro')}
            className="text-slate-500 hover:text-white text-xs underline"
          >
            ¿No tiene una licencia? Regístrese aquí
          </button>
        </div>
      </motion.div>
    </main>
  );
}
