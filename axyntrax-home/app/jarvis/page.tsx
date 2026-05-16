'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Users, 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3, 
  Clock,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { Logo } from '@/components/Logo';

interface Lead {
  id: string;
  nombreUsuario?: string;
  empresa?: string;
  telefono?: string;
  fechaRegistro?: number;
  lastInteraction?: number;
  moduloActual?: string;
  submodulosInteresado?: string[];
  followup_3d_sent?: boolean;
  leadTemperature?: 'HOT' | 'WARM' | 'COLD';
  leadIntent?: string;
  resumenNecesidad?: string;
}

export default function JarvisDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, messages: 0 });

  useEffect(() => {
    const q = query(collection(db, 'cecilia_states'), orderBy('lastInteraction', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = [];
      let totalMsg = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        leadsData.push({ ...data, id: doc.id } as Lead);
        if (data.lastInteraction) totalMsg++;
      });
      
      setLeads(leadsData);
      setStats({
        total: snapshot.size,
        active: leadsData.filter(l => l.submodulosInteresado && l.submodulosInteresado.length > 0).length,
        messages: totalMsg
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-[#00D4FF]/30">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0A0A0F] border-r border-white/5 p-6 z-50">
        <div className="mb-12 flex justify-center">
          <Logo size={120} />
        </div>
        
        <nav className="space-y-2">
          <NavItem icon={<Activity size={18} />} label="Overview" active />
          <NavItem icon={<Users size={18} />} label="Leads & Clients" />
          <NavItem icon={<MessageSquare size={18} />} label="Cecilia Logs" />
          <NavItem icon={<BarChart3 size={18} />} label="Analytics" />
          <NavItem icon={<Zap size={18} />} label="MARK (Marketing IA)" />
          <div className="pt-10">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-4 mb-4">System</p>
            <NavItem icon={<Shield size={18} />} label="Security" />
            <NavItem icon={<Zap size={18} />} label="Matrix Keys" />
          </div>
        </nav>

        <div className="absolute bottom-10 left-6 right-6 p-4 bg-[#00D4FF]/5 rounded-2xl border border-[#00D4FF]/10">
          <p className="text-[10px] font-mono text-[#00D4FF] mb-1">JARVIS_VERSION</p>
          <p className="text-xs font-bold">v3.5.0-ALPHA</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 p-10">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight">JARVIS <span className="text-[#00D4FF]">PRIME</span></h1>
            <p className="text-slate-500 text-sm">Panel de Supervisión de Agentes Autónomos</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-slate-400">CECILIA_ONLINE</span>
            </div>
            <div className="w-10 h-10 bg-[#00D4FF] rounded-full flex items-center justify-center text-black font-bold">M</div>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Leads" value={stats.total} icon={<Users className="text-[#00D4FF]" />} trend="+12% hoy" />
          <StatCard label="Demos Activas" value={stats.active} icon={<Zap className="text-yellow-400" />} trend="+5 hoy" />
          <StatCard label="Interacciones Cecilia" value={stats.messages} icon={<MessageSquare className="text-purple-400" />} trend="24h logs" />
          <StatCard label="System Uptime" value="99.9%" icon={<Shield className="text-green-400" />} trend="Atlas OK" />
        </div>

        {/* RECENT ACTIVITY TABLE */}
        <div className="bg-[#0A0A0F] rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Activity size={18} className="text-[#00D4FF]" /> Actividad Reciente de Cecilia</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Buscar lead..." className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-[#00D4FF]" />
              </div>
              <button className="p-2 bg-white/5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all"><Filter size={14} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 font-medium">Cliente / Empresa</th>
                  <th className="px-6 py-4 font-medium">Estado / Canal</th>
                  <th className="px-6 py-4 font-medium">Módulo Interés</th>
                  <th className="px-6 py-4 font-medium">Última Vez</th>
                  <th className="px-6 py-4 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-600 animate-pulse">Sincronizando con red neural...</td></tr>
                ) : leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{lead.nombreUsuario || 'Anónimo'}</div>
                      <div className="text-slate-500 text-[10px]">{lead.empresa || 'Empresa no registrada'}</div>
                      {lead.resumenNecesidad && (
                        <div className="mt-2 text-[9px] text-[#00D4FF] bg-[#00D4FF]/5 p-1 rounded border border-[#00D4FF]/10 max-w-[200px] italic">
                          "{lead.resumenNecesidad}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            lead.leadTemperature === 'HOT' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 
                            lead.leadTemperature === 'WARM' ? 'bg-yellow-400' : 'bg-blue-500'
                          }`} />
                          <span className="font-bold text-[10px]">
                            {lead.leadTemperature || 'WARM'} {lead.leadIntent ? `(${lead.leadIntent})` : ''}
                          </span>
                        </div>
                        <div className="text-slate-600 font-mono text-[9px]">{lead.telefono}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.submodulosInteresado && lead.submodulosInteresado.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.submodulosInteresado.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-md border border-[#00D4FF]/20">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Explorando módulos...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} />
                        {lead.lastInteraction ? new Date(lead.lastInteraction).toLocaleTimeString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-[#00D4FF]/20 rounded-lg text-[#00D4FF] transition-all"><ExternalLink size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

    </div>
  );
}

// --- SUBCOMPONENTES ---

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-[#00D4FF] text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.3)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-[#0A0A0F] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
        <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">{trend}</span>
      </div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black">{value}</h4>
    </div>
  );
}
