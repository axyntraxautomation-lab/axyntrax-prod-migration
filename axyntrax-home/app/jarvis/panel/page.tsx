'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  LogOut, 
  Server, 
  AlertTriangle,
  Mail,
  Users
} from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function JarvisPanelPage() {
  const router = useRouter();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/jarvis/logout', { method: 'POST' });
    router.push('/jarvis/login');
  };

  return (
    <main className="min-h-screen p-8 flex flex-col">
      {/* Header Jarvis */}
      <header className="flex justify-between items-center mb-10 border-b border-[#00D4FF]/20 pb-6">
        <div className="flex items-center gap-4">
          <Logo size={120} light className="scale-75 origin-left" />
          <div className="border-l border-[#00D4FF]/30 pl-4">
            <h1 className="text-sm font-mono font-bold tracking-[0.3em]">JARVIS OS PRIME</h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Neural Core Command v1.0.0</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right font-mono">
            <p className="text-[10px] text-slate-500 uppercase">Tiempo Sistema</p>
            <p className="text-xs text-[#00D4FF]">{time.toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono hover:bg-red-500 hover:text-white transition-all rounded"
          >
            <LogOut size={14} /> CERRAR_PROTOCOLO
          </button>
        </div>
      </header>

      {/* Grid de Resumen Ejecutivo (Fase 1 Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'SALUD_SISTEMA', val: '100%', icon: <ShieldCheck size={16} />, color: 'text-green-400' },
          { label: 'IA_ACTIVAS', val: '12/12', icon: <Activity size={16} />, color: 'text-[#00D4FF]' },
          { label: 'ALERTA_CRITICA', val: '0', icon: <AlertTriangle size={16} />, color: 'text-slate-500' },
          { label: 'LATENCIA_EDGE', val: '24ms', icon: <Server size={16} />, color: 'text-[#00D4FF]' },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-mono font-bold">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Terminal Log de IAs */}
        <div className="lg:col-span-2 bg-black/40 border border-[#00D4FF]/10 rounded-2xl p-6 font-mono overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-[#00D4FF]/10 pb-2">
            <span className="text-[10px] text-slate-500 flex items-center gap-2"><Zap size={12} /> CONSOLA_LOGS_IA</span>
            <span className="text-[8px] text-green-500 animate-pulse">● LIVE_STREAM</span>
          </div>
          <div className="flex-1 text-[10px] space-y-2 overflow-y-auto">
            <p className="text-slate-500">[20:20:15] JARVIS: Inicializando red neuronal...</p>
            <p className="text-slate-500">[20:20:16] CECILIA: Webhook activo en puerto 5000.</p>
            <p className="text-[#00D4FF]">[20:20:18] ATLAS: Reporte de salud: Todos los sistemas nominales.</p>
            <p className="text-slate-500">[20:20:20] MATRIX: Licencia AX-FULL-9428 activa.</p>
            <p className="text-yellow-400">[20:20:25] NEO: Nuevo cliente detectado. Onboarding en proceso.</p>
            <p className="animate-pulse text-[#00D4FF]">_</p>
          </div>
        </div>

        {/* Panel de Tareas CEO */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xs font-mono font-bold mb-6 flex items-center gap-2 text-white">
            <Users size={14} /> TAREAS_PENDIENTES
          </h3>
          <div className="space-y-4">
            {[
              { t: 'Revisar reporte Cecilia MED', status: 'pending' },
              { t: 'Actualizar API Meta Graph', status: 'urgent' },
              { t: 'Audit de seguridad Firebase', status: 'done' },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-[#00D4FF]/30 transition-all cursor-pointer">
                <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'urgent' ? 'bg-red-500' : task.status === 'pending' ? 'bg-[#00D4FF]' : 'bg-green-500'}`} />
                <span className="text-[10px] font-mono text-slate-300">{task.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
