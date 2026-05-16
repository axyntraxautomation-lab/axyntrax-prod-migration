'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Terminal, 
  Cpu, 
  Server, 
  Activity, 
  AlertTriangle, 
  Database, 
  Key,
  Eye,
  Settings,
  Lock,
  Search
} from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function JarvisPersonalPanel() {
  const [logs, setLogs] = useState([
    { id: 1, type: 'INFO', msg: 'Protocolo Alfa v2.0: Salud estable.', time: '12:00:01' },
    { id: 2, type: 'WARN', msg: 'Latencia inusual detectada en el Webhook Meta.', time: '12:05:22' },
    { id: 3, type: 'SECURITY', msg: 'Licencia AX-DEMO-4A5B activada exitosamente.', time: '12:08:45' },
    { id: 4, type: 'ALERT', msg: 'Intento de acceso denegado en ruta /api/jarvis/keygen', time: '12:10:12' }
  ]);

  return (
    <main className="min-h-screen bg-[#020205] text-[#00D4FF] font-mono p-8 overflow-hidden flex flex-col">
      {/* JARVIS HEADER */}
      <header className="flex justify-between items-center border-b border-[#00D4FF]/20 pb-8 mb-8">
        <div className="flex items-center gap-6">
          <Logo size={50} />
          <div className="h-10 w-[1px] bg-[#00D4FF]/20" />
          <div>
            <h1 className="text-2xl font-black tracking-widest uppercase">JARVIS PRIME OS</h1>
            <p className="text-[10px] text-[#00D4FF]/50 tracking-[0.4em]">SISTEMA DE ORQUESTACIÓN PRIVADA</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-full text-[10px]">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             ATLAS ACTIVE
          </div>
          <button className="p-2 border border-[#00D4FF]/20 rounded-xl hover:bg-[#00D4FF]/10 transition-all"><Settings size={18} /></button>
        </div>
      </header>

      {/* CORE GRID */}
      <div className="grid grid-cols-12 gap-8 flex-1">
        
        {/* ATLAS MONITORING (Left) */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-[#00D4FF]/5 border border-[#00D4FF]/10 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <Cpu size={24} />
                <span className="text-xs">98.2%</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#00D4FF]/50">DeepSeek V4 Flash</p>
            </div>
            <div className="p-6 bg-[#00D4FF]/5 border border-[#00D4FF]/10 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <Server size={24} />
                <span className="text-xs">ONLINE</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#00D4FF]/50">Atlas Health Node</p>
            </div>
            <div className="p-6 bg-[#7B2FFF]/5 border border-[#7B2FFF]/10 rounded-3xl text-[#7B2FFF]">
              <div className="flex justify-between items-start mb-4">
                <Shield size={24} />
                <span className="text-xs">SECURE</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#7B2FFF]/50">Protocolo Alfa</p>
            </div>
          </div>

          {/* SYSTEM CONSOLE */}
          <div className="flex-1 bg-black border border-[#00D4FF]/20 rounded-[40px] p-8 flex flex-col overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-sm font-bold flex items-center gap-3"><Terminal size={16} /> ATLAS_EVENT_FEED</h2>
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/20" />
                 <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                 <div className="w-3 h-3 rounded-full bg-green-500/20" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-4">
               {logs.map(log => (
                 <div key={log.id} className="text-xs flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    <span className="text-slate-600">[{log.time}]</span>
                    <span className={`font-bold ${log.type === 'ALERT' ? 'text-red-500' : log.type === 'SECURITY' ? 'text-green-400' : 'text-[#00D4FF]'}`}>
                      {log.type}:
                    </span>
                    <span className="text-slate-300">{log.msg}</span>
                 </div>
               ))}
               <div className="text-[#00D4FF]/30 mt-4">_</div>
            </div>
            <div className="absolute bottom-8 right-8 flex items-center gap-2 text-[10px] text-[#00D4FF]/30">
               <Activity size={12} className="animate-pulse" /> MONITOREO CONSTANTE
            </div>
          </div>
        </div>

        {/* PRIVATE TOOLS (Right) */}
        <div className="col-span-4 space-y-8">
          <div className="p-8 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Key size={80} /></div>
            <h3 className="text-lg font-black mb-4">Módulo de Keygen</h3>
            <p className="text-xs text-slate-400 mb-6">Generación manual de llaves bajo supervisión JARVIS.</p>
            <button className="w-full py-4 bg-[#00D4FF] text-black font-black text-xs tracking-widest hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all flex items-center justify-center gap-3">
               GENERAR NUEVA LLAVE <Lock size={14} />
            </button>
          </div>

          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px]">
            <h3 className="text-sm font-bold mb-6 flex items-center gap-3"><Eye size={16} /> ESTADO DE TENANTS</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400">Ferretería "El Rayo"</span>
                <span className="text-[10px] text-green-400 font-bold uppercase">Activo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400">Clínica Dental Sur</span>
                <span className="text-[10px] text-green-400 font-bold uppercase">Activo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400">CarWash Prime</span>
                <span className="text-[10px] text-yellow-500 font-bold uppercase">Pendiente</span>
              </div>
            </div>
            <button className="w-full mt-6 py-4 border border-[#00D4FF]/20 text-[#00D4FF] text-xs font-bold hover:bg-[#00D4FF]/5 transition-all flex items-center justify-center gap-2">
               VER TODOS <Search size={14} />
            </button>
          </div>

          <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-[40px]">
             <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <AlertTriangle size={14} /> Protocolo de Emergencia
             </h3>
             <button className="w-full py-3 bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] font-black hover:bg-red-500 hover:text-white transition-all">
               SUSPENDER TODO EL SISTEMA
             </button>
          </div>
        </div>
      </div>
    </main>
  );
}
