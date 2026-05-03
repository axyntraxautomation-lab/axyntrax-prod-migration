import React from 'react';
import { useGuardianStore } from './GuardianStore';
import { 
  ShieldCheck, 
  Activity, 
  Terminal, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Database,
  Globe,
  Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * GuardianPanel.jsx
 * Interfaz de control maestro para AxiaGuardian.
 * Proporciona visibilidad total sobre la salud, seguridad y autonomía del ecosistema.
 */

export default function GuardianPanel() {
  const { targetsStatus, lastAction, history } = useGuardianStore();

  return (
    <div className="space-y-8 p-1">
      {/* SECCIÓN 1 — Estado en tiempo real */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Estado en tiempo real
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard 
            title="Web Axyntrax" 
            status={targetsStatus.web?.status} 
            latency="42ms" 
            icon={Globe}
          />
          <StatusCard 
            title="Dashboard Miguel" 
            status={targetsStatus.dashboard?.status} 
            latency="28ms" 
            icon={Monitor}
          />
          <StatusCard 
            title="SSL Certificates" 
            status="válido" 
            latency="Expira en 45 d" 
            icon={Lock}
            isSSL
          />
          <StatusCard 
            title="Sincronización" 
            status="OK" 
            latency="v2.4.0 (Global)" 
            icon={RefreshCw}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECCIÓN 2 — Acciones de AxiaGuardian */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <Terminal className="w-3 h-3" /> Acciones de AxiaGuardian (Log)
          </h3>
          <div className="bg-black border border-white/10 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30">Fecha / Hora</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30">Acción</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30">Zona</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.filter(h => h.zone !== 'roja').slice(0, 8).map((log, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono text-white/40 tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-[11px] font-bold text-white uppercase">{log.action || 'Vigilancia'}</p>
                       <p className="text-[9px] text-white/20 truncate max-w-[200px]">{log.details}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                         log.zone === 'verde' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                       )}>
                         {log.zone}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", log.result === 'exito' ? "bg-green-500" : "bg-red-500")} />
                          <span className="text-[10px] font-bold text-white/60 uppercase">{log.result || 'Ok'}</span>
                       </div>
                    </td>
                  </tr>
                ))}
                {/* Ejemplo de Acción Bloqueada en Zona Roja */}
                <tr className="bg-red-500/[0.02]">
                   <td className="px-6 py-4 text-[10px] font-mono text-red-500/40 tabular-nums">--/-- --:--</td>
                   <td className="px-6 py-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                         <Lock className="w-3 h-3 text-red-500/40" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-red-500/40 italic">Acción bloqueada · Pendiente aprobación Miguel</span>
                      </div>
                   </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN 3 y 4 — Pruebas y Seguridad */}
        <div className="space-y-8">
           {/* SECCIÓN 3 — Pruebas automáticas */}
           <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Pruebas Hoy
              </h3>
              <div className="bg-black border border-white/10 rounded-3xl p-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Ultima Prueba</span>
                    <span className="text-[10px] font-black text-[#10b981] uppercase font-mono">03:42 AM · EXITO</span>
                 </div>
                 <div className="h-px bg-white/5" />
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                       <Database className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white uppercase">Huella Cero</p>
                       <p className="text-[9px] text-white/30 truncate">Datos temporales eliminados correctamente.</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* SECCIÓN 4 — Alertas y seguridad */}
           <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Seguridad & Blindaje
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[8px] font-black text-white/20 uppercase">Ataques Bloqueados</p>
                    <p className="text-lg font-black text-white">124</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[8px] font-black text-white/20 uppercase">Vulnerabilidades</p>
                    <p className="text-lg font-black text-turquoise font-mono">00</p>
                 </div>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl group cursor-help transition-all">
                 <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    <div>
                       <p className="text-[10px] font-black text-red-500 uppercase">Alertas en Espera</p>
                       <p className="text-[9px] text-red-500/50 uppercase font-bold">1 aprobación requerida</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, status, latency, icon: Icon, isSSL }) {
  const isHealthy = status === 'online' || status === 'válido' || status === 'OK';
  const color = isHealthy ? '#10b981' : status === 'caido' ? '#ef4444' : '#f59e0b';

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-black border border-white/10 rounded-3xl p-6 space-y-4 transition-all hover:border-white/20"
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <div 
          className="w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current" 
          style={{ color, backgroundColor: color }} 
        />
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest">{title}</h4>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-sm font-black text-white uppercase">{status || 'Cargando...'}</p>
          <span className="text-[9px] font-mono text-white/20">{latency}</span>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
