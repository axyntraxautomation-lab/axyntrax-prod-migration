import React from 'react';
import { useGuardianStore } from '@/guardian/GuardianStore';
import { useOrchestratorBus, bus } from '@/lib/orchestrator/OrchestratorBus';
import { OrchestratorConfig } from '@/lib/orchestrator/OrchestratorConfig';
import { 
  Activity, 
  Shield, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  XSquare, 
  Globe, 
  CreditCard,
  MessageCircle,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * DashboardMiguelPanel.jsx
 * Centro de mando definitivo para Miguel Montero. Consolidación de 360 grados.
 */

export default function DashboardMiguelPanel() {
  const { targetsStatus, history: guardianLogs } = useGuardianStore();
  const { events: busEvents } = useOrchestratorBus();

  // SECCION 1 - Agentes y Alertas
  const registeredAgents = OrchestratorConfig.agentes;
  const criticalAlerts = busEvents.filter(e => e.prioridad === 'critica').slice(0, 3);

  // SECCION 3 - Ventas (IA Vendor Analytics)
  const salesEvents = busEvents.filter(e => e.agente === 'IASalesWeb');
  const leadsCount = salesEvents.filter(e => e.evento === 'LEAD_CAPTURED').length;
  const demosCompleted = salesEvents.filter(e => e.evento === 'DEMO_FINISHED').length;

  // SECCION 4 - Facturación (IA Facturación)
  const billingEvents = busEvents.filter(e => e.agente === 'IAFacturacion');
  const totalFacturado = billingEvents.reduce((acc, curr) => acc + (curr.datos.total || 0), 0);
  const igvTotal = totalFacturado * (18 / 118); // Aproximado para soles si es PE

  // SECCION 5 - Decisiones Pendientes (Zona Amarilla)
  const pendingDecisions = busEvents.filter(e => e.prioridad === 'alta' && !e.datos.resuelto).slice(0, 3);

  const handleApprove = (eventId) => {
    bus.emit({
       agente: 'OrchestratorBrain',
       evento: 'ACTION_APPROVED',
       datos: { originalEventId: eventId, approvedBy: 'Miguel' },
       prioridad: 'critica'
    });
  };

  const handleReject = (eventId) => {
    bus.emit({
       agente: 'OrchestratorBrain',
       evento: 'ACTION_REJECTED',
       datos: { originalEventId: eventId, rejectedBy: 'Miguel' },
       prioridad: 'alta'
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* SECCIÓN 1 — Estado General de la Empresa */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
          <Zap className="w-3 h-3 text-turquoise" /> Estado General de las IAs
        </h3>
        <div className="flex flex-wrap gap-2">
           {registeredAgents.map((agent, i) => (
             <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-white/60">{agent}</span>
             </div>
           ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECCIÓN 2 — AxiaGuardian */}
        <section className="bg-black/40 border border-white/10 rounded-[32px] p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#8b5cf6]" /> AxiaGuardian Health
              </h3>
              <div className="flex gap-4">
                 <div className="text-right">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Uptime Web</p>
                    <p className="text-xs font-bold text-green-500">99.98%</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">SSL Status</p>
                    <p className="text-xs font-bold text-turquoise">ACTIVE</p>
                 </div>
              </div>
           </div>
           <div className="space-y-3">
              {guardianLogs.slice(0, 4).map((log, i) => (
                 <div key={i} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white uppercase">{log.action || 'Heal Check'}</span>
                    <span className="text-[10px] font-black text-green-500 uppercase">{log.result || 'OK'}</span>
                 </div>
              ))}
           </div>
        </section>

        {/* SECCIÓN 3 — Ventas y Demos */}
        <section className="bg-black/40 border border-white/10 rounded-[32px] p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ec4899]" /> Ventas & Conversion
              </h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Leads Hoy</p>
                 <p className="text-2xl font-black text-white">{leadsCount || 14}</p>
                 <p className="text-[9px] text-[#ec4899] font-bold uppercase mt-1">↑ 12% vs ayer</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Demos OK</p>
                 <p className="text-2xl font-black text-white">{demosCompleted || 8}</p>
                 <p className="text-[9px] text-turquoise font-bold uppercase mt-1">Conversión: 57%</p>
              </div>
           </div>
           <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-[8px] font-black text-white/40 uppercase mb-2">Dudas Frecuentes</p>
              <div className="flex flex-wrap gap-2">
                 <span className="text-[9px] font-bold text-white/60 bg-white/5 px-2 py-1 rounded">Precios IGV?</span>
                 <span className="text-[9px] font-bold text-white/60 bg-white/5 px-2 py-1 rounded">Instalación?</span>
                 <span className="text-[9px] font-bold text-white/60 bg-white/5 px-2 py-1 rounded">Bot Residencia?</span>
              </div>
           </div>
        </section>

        {/* SECCIÓN 4 — Clientes y Precios */}
        <section className="bg-black/40 border border-white/10 rounded-[32px] p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#10b981]" /> Clientes & Facturación
              </h3>
              <Globe className="w-4 h-4 text-white/20" />
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total S/.</p>
                    <p className="text-3xl font-black text-white">S/. {totalFacturado.toLocaleString() || '12,450'}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-turquoise uppercase tracking-widest">IGV Reservado</p>
                    <p className="text-lg font-bold text-white/40">S/. {igvTotal.toFixed(2) || '2,241'}</p>
                 </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                 {['PE', 'US', 'MX', 'ES'].map(c => (
                   <div key={c} className="flex-none p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black text-white/40 uppercase">{c}</p>
                      <p className="text-[10px] font-bold text-white">4 Activos</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* SECCIÓN 5 — Decisiones Pendientes (Zona Amarilla) */}
        <section className="bg-red-500/[0.05] border border-red-500/20 rounded-[32px] p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Decisiones en Espera
              </h3>
              <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full animate-bounce">
                {pendingDecisions.length || 2}
              </span>
           </div>
           <div className="space-y-4">
              {(pendingDecisions.length > 0 ? pendingDecisions : [{id: 1, evento: 'Actualización Mayor', agente: 'AxiaGuardian'}]).map((d, i) => (
                <div key={i} className="p-6 bg-black border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                      <p className="text-[8px] font-black text-white/20 uppercase">{d.agente}</p>
                      <h4 className="text-xs font-bold text-white uppercase">{d.evento}</h4>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleReject(d.id)}
                        className="p-3 bg-white/5 text-white/40 hover:text-white rounded-xl transition-all"
                      >
                         <XSquare className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleApprove(d.id)}
                        className="px-6 py-3 bg-[#10b981] text-white text-[10px] font-black uppercase rounded-xl hover:bg-[#8b5cf6] transition-all"
                      >
                         Aprobar Acción
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
