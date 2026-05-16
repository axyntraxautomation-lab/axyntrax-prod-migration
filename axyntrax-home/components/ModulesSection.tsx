'use client';

import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, 
  PawPrint, 
  Scale, 
  Car, 
  Building, 
  UtensilsCrossed, 
  Truck, 
  Wrench, 
  Bus, 
  TrendingUp, 
  Activity, 
  Dumbbell, 
  Hammer,
  CheckCircle2,
  Plus,
  BarChart3,
  Bot,
  Smartphone,
  Users2,
  ChevronRight,
  MessageCircle,
  LayoutGrid,
  Zap,
  ShoppingBag,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import { MODULES as CATALOG } from "@/lib/modules-data";

const PRICE_BASE = 235;

const ICON_MAP: Record<string, any> = {
  BARBER: Dumbbell,
  DENT: Activity,
  LEX: Scale,
  CONTA: BarChart3,
  VET: PawPrint,
  LICO: UtensilsCrossed,
  WASH: Car,
  REST: UtensilsCrossed,
  MEC: Wrench,
  FERR: Hammer,
  ABAS: ShoppingBag,
  BODE: Building,
  FLOT: Truck
};

const COLOR_MAP: Record<string, string> = {
  BARBER: "#7B2FFF",
  DENT: "#00D4FF",
  LEX: "#00D4FF",
  CONTA: "#7B2FFF",
  VET: "#00D4FF",
  LICO: "#7B2FFF",
  WASH: "#7B2FFF",
  REST: "#7B2FFF",
  MEC: "#7B2FFF",
  FERR: "#00D4FF",
  ABAS: "#00D4FF",
  BODE: "#00D4FF",
  FLOT: "#00D4FF"
};

export default function ModulesSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"base" | "extras" | "precios">("base");
  const [selectedExtras, setSelectedExtras] = useState<Record<string, string[]>>({});

  const toggleExtra = (modId: string, submoduleName: string) => {
    setSelectedExtras(prev => {
      const current = prev[modId] || [];
      if (current.includes(submoduleName)) {
        return { ...prev, [modId]: current.filter(e => e !== submoduleName) };
      }
      return { ...prev, [modId]: [...current, submoduleName] };
    });
  };

  const calculateTotal = (modId: string) => {
    const mod = CATALOG.find(m => m.id === modId);
    if (!mod) return 0;
    
    let total = PRICE_BASE;
    const selected = selectedExtras[modId] || [];
    
    selected.forEach(name => {
      const sub = mod.submodules.find(s => s.name === name);
      if (sub && sub.type === "PAID") total += sub.price || 0;
    });
    
    return total;
  };

  return (
    <section id="modulos" className="relative py-32 overflow-hidden bg-[#020204]">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4FF]/5 border border-[#00D4FF]/20 text-[#00D4FF] text-xs font-bold tracking-[0.2em] mb-8"
          >
            <Zap size={14} className="animate-pulse" /> CATÁLOGO COMERCIAL v3.0
          </motion.div>
          <h2 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-8 leading-[0.9]">
            Elija su Rubro <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-white to-[#7B2FFF]">7 Submódulos Maestros</span>
          </h2>
          <p className="text-slate-500 text-xl max-w-3xl mx-auto">
            Seleccione el motor que moverá su empresa. Incluye soporte técnico centralizado Atlas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
          {CATALOG.map((mod, index) => {
            const Icon = ICON_MAP[mod.id] || LayoutGrid;
            const isExpanded = expandedId === mod.id;
            const total = calculateTotal(mod.id);
            const color = COLOR_MAP[mod.id] || "#ffffff";

            return (
              <motion.div
                key={mod.id}
                className={`group relative rounded-[48px] overflow-hidden bg-[#0A0A0F] border ${isExpanded ? 'border-[#00D4FF]/40' : 'border-white/5'} transition-all duration-700 flex flex-col`}
                style={{ boxShadow: isExpanded ? `0 0 100px ${color}15` : "none" }}
              >
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                      <Icon size={32} style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white">{mod.label}</h3>
                      <span className="text-[10px] text-[#00D4FF] font-mono tracking-widest uppercase">Rubro Certificado</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-8">{mod.desc}</p>

                  <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl">
                    {["base", "extras", "precios"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 min-h-[300px]">
                    <AnimatePresence mode="wait">
                      {activeTab === "base" && (
                        <motion.div key="base" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                          <p className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-widest mb-4">Gratis (Incluidos)</p>
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <HelpCircle size={14} className="text-[#00D4FF]" />
                            <span className="text-sm text-slate-300 font-bold">Soporte Técnico Centralizado Atlas</span>
                          </div>
                          {mod.submodules.filter(s => s.type === "FREE").map((s, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                              <CheckCircle2 size={14} className="text-[#00D4FF]" />
                              <span className="text-sm text-slate-300 font-bold">{s.name}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeTab === "extras" && (
                        <motion.div key="extras" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                          <p className="text-[10px] font-mono text-[#7B2FFF] uppercase tracking-widest mb-4">Submódulos Premium</p>
                          {mod.submodules.filter(s => s.type === "PAID").map((s, i) => {
                            const isSelected = selectedExtras[mod.id]?.includes(s.name);
                            return (
                              <button
                                key={i}
                                onClick={() => toggleExtra(mod.id, s.name)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-[#00D4FF]/10 border-[#00D4FF]/40' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                              >
                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{s.name}</span>
                                <span className="text-xs text-[#00D4FF] font-black">S/ {s.price}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}

                      {activeTab === "precios" && (
                        <motion.div key="precios" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-8 rounded-3xl bg-white/[0.05] border border-white/5">
                          <div className="flex justify-between mb-4">
                            <span className="text-slate-400 text-sm">Plan Base {mod.label}</span>
                            <span className="text-white font-bold">S/ {PRICE_BASE}</span>
                          </div>
                          {(selectedExtras[mod.id] || []).map((name, i) => (
                            <div key={i} className="flex justify-between mb-2 text-xs text-slate-300">
                              <span>+ {name}</span>
                              <span className="text-[#00D4FF]">S/ {mod.submodules.find(s => s.name === name)?.price}</span>
                            </div>
                          ))}
                          <div className="h-[1px] bg-white/10 my-6" />
                          <div className="flex justify-between items-end">
                            <span className="text-xl font-black text-white">TOTAL</span>
                            <div className="text-right">
                              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF]">S/ {total}</span>
                              <p className="text-[10px] text-slate-300 uppercase font-mono font-bold">Inc. IGV / Mensual</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-8">
                    <a
                      href={`https://wa.me/51991740590?text=Hola Cecilia, quiero activar el modulo ${mod.label} con los siguientes extras: ${(selectedExtras[mod.id] || []).join(', ')}. Total estimado: S/ ${total}.`}
                      className="w-full py-5 rounded-3xl bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF] text-black font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00D4FF]/20"
                    >
                      SOLICITAR ACTIVACIÓN <MessageCircle size={16} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
