import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  MessageSquare, 
  Zap, 
  Settings, 
  Download, 
  Bell, 
  User, 
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { MODULES as CATALOG } from '@/lib/modules-data';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">+12% hoy</span>
    </div>
    <h3 className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-widest">{title}</h3>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

export default function CeciliaMasterDashboard() {
  const [activeRubro, setActiveRubro] = useState("WASH"); // Ejemplo: CarWash
  const rubroData = CATALOG.find(m => m.id === activeRubro);

  return (
    <main className="min-h-screen bg-[#050508] text-white flex">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 p-8 flex flex-col gap-10">
        <Logo size={40} className="origin-left" />
        <nav className="flex flex-col gap-2">
          <button className="flex items-center gap-4 p-4 rounded-2xl bg-[#00D4FF]/10 text-[#00D4FF] font-bold text-sm">
            <LayoutDashboard size={18} /> Resumen
          </button>
          <button className="flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-white transition-all text-sm">
            <MessageSquare size={18} /> Mensajes
          </button>
          <button className="flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-white transition-all text-sm">
            <BarChart3 size={18} /> Reportes
          </button>
          <button className="flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-white transition-all text-sm">
            <Settings size={18} /> Ajustes
          </button>
        </nav>
      </aside>

      {/* CONTENT */}
      <section className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2">Hola, Miguel 👋</h1>
            <p className="text-slate-500 text-sm">Visión gerencial de <span className="text-[#00D4FF] font-bold">Axyntrax CarWash Prime</span></p>
          </div>
          <div className="flex gap-4">
            <button className="p-3 rounded-full bg-white/5 border border-white/10 text-slate-400"><Bell size={20} /></button>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#050508] flex items-center justify-center"><User size={20} /></div>
            </div>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Casos Activos" value="24" icon={Activity} color="cyan" />
          <StatCard title="Derivados" value="08" icon={ChevronRight} color="blue" />
          <StatCard title="Atención IA" value="98%" icon={Zap} color="yellow" />
          <StatCard title="Cerrados" value="156" icon={CheckCircle2} color="green" />
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* MÓDULOS DEL RUBRO */}
          <div className="col-span-8 space-y-8">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] backdrop-blur-xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3"><Zap size={20} className="text-[#00D4FF]" /> Mis Submódulos</h2>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Catálogo v3.0</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {rubroData?.submodules.map((s, i) => (
                  <div key={i} className={`p-5 rounded-3xl border ${s.type === 'FREE' ? 'bg-[#00D4FF]/5 border-[#00D4FF]/20' : 'bg-white/5 border-white/5'} flex items-center justify-between`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.type === 'FREE' ? 'bg-[#00D4FF] text-black' : 'bg-white/5 text-slate-500'}`}>
                        {s.type === 'FREE' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{s.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{s.type === 'FREE' ? 'Activo' : 'Disponible'}</p>
                      </div>
                    </div>
                    {s.type === 'PAID' && <button className="text-[10px] font-black text-[#00D4FF] hover:underline">ACTIVAR</button>}
                  </div>
                ))}
              </div>
            </div>

            {/* NEURAL FEED */}
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
              <h2 className="text-xl font-bold mb-6">Resumen Neural (WhatsApp)</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-400">
                   <p className="mb-2"><span className="text-[#00D4FF] font-bold">Cecilia detectó:</span> 5 nuevos prospectos interesados en automatización omnicanal hoy.</p>
                   <span className="text-[10px] text-slate-600">Hace 12 min</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-400">
                   <p className="mb-2"><span className="text-[#7B2FFF] font-bold">Atlas reporta:</span> Integridad del sistema al 100%. Protocolo Alfa activo y seguro.</p>
                   <span className="text-[10px] text-slate-600">Hace 1 hora</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-400">
                   <p className="mb-2"><span className="text-[#00D4FF] font-bold">JARVIS prioriza:</span> Optimización de flujo en el módulo {rubroData?.label} completada.</p>
                   <span className="text-[10px] text-slate-600">Hace 3 horas</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASIDE - REPORTES & ACCIONES */}
          <div className="col-span-4 space-y-8">
            <div className="bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] p-8 rounded-[40px] text-black">
              <h3 className="text-2xl font-black mb-4 leading-tight">Reporte Gerencial Diario</h3>
              <p className="text-black/60 text-sm mb-6 font-medium">Analizado por JARVIS. 98% de precisión operativa.</p>
              <button className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3">
                <Download size={18} /> DESCARGAR PDF
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
              <h3 className="text-sm font-bold mb-6 uppercase tracking-widest text-slate-500">Salud del Sistema</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-slate-300">WhatsApp Cecilia: Online</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-slate-300">Núcleo DeepSeek: Stable</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-300">Atlas Monitor: Syncing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
