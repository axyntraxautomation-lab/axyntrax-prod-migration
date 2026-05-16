'use client';

import { motion } from "framer-motion";
import { 
  ChevronRight, Zap, PlayCircle, ShieldCheck, BarChart3, Bot, LayoutGrid, 
  ArrowRight, MessageCircle, CheckCircle2, Star, TrendingUp, Activity, 
  Stethoscope, PawPrint, Scale, Car, Building, UtensilsCrossed, Truck, Wrench, Bus, ShoppingBag, Hammer
} from "lucide-react";
import Link from "next/link";
import ModulesSection from "@/components/ModulesSection";
import CeciliaSection from "@/components/CeciliaSection";
import Footer from "@/components/Footer";

const AGENTS = [
  { name: "Cecilia", role: "Atención neural omnicanal", icon: Bot, color: "#00D4FF" },
  { name: "Atlas", role: "Centinela de seguridad 24/7", icon: ShieldCheck, color: "#7B2FFF" },
  { name: "JARVIS", role: "Orquestador maestro privado", icon: LayoutGrid, color: "#00D4FF" },
  { name: "Mark", role: "Director de marketing IA", icon: BarChart3, color: "#7B2FFF" }
];

const INDUSTRIES = [
  { id: "BARBER", label: "Barbería", icon: Star },
  { id: "DENT", label: "Dentista", icon: Activity },
  { id: "LEX", label: "Legal", icon: Scale },
  { id: "VET", label: "Veterinaria", icon: PawPrint },
  { id: "WASH", label: "Carwash", icon: Car },
  { id: "REST", label: "Restaurante", icon: UtensilsCrossed },
  { id: "MEC", label: "Mecánica", icon: Wrench },
  { id: "FERR", label: "Ferretería", icon: Hammer },
  { id: "ABAS", label: "Markets", icon: ShoppingBag },
  { id: "BODE", label: "Bodegas", icon: Building },
  { id: "FLOT", label: "Flotas", icon: Truck },
  { id: "CONTA", label: "Contable", icon: BarChart3 },
  { id: "MED", label: "Clínica", icon: Stethoscope }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020204] selection:bg-[#00D4FF]/30">
      
      {/* HERO SECTION - REFACTORIZADO TOTAL */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            
            <div className="lg:col-span-7 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4FF]/5 border border-[#00D4FF]/20 text-[#00D4FF] text-[10px] font-black tracking-[0.4em] mb-8 uppercase"
              >
                <Zap size={14} className="animate-pulse" /> Ecosistema Neural de Automatización
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-black tracking-tight text-white mb-8 leading-[0.95]"
              >
                La orquestación inteligente <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-white to-[#7B2FFF]">que tu empresa necesita.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-xl md:text-2xl max-w-2xl mb-12 font-medium leading-relaxed"
              >
                AXYNTRAX une 13 industrias especializadas, 91 submódulos y una sola inteligencia operativa para vender, atender y crecer 24/7.
              </motion.p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link 
                  href="/registro"
                  className="w-full sm:w-auto px-10 py-5 rounded-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-[#00D4FF] transition-all flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
                >
                  Solicitar Activación <ArrowRight size={16} />
                </Link>
                <button className="w-full sm:w-auto px-10 py-5 rounded-full bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  Agendar Demo <PlayCircle size={18} />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <CeciliaSection isCompact={true} />
            </div>
          </div>
        </div>
      </section>

      {/* 13 INDUSTRIAS SECTION */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-12 text-center">Soluciones Especializadas por Rubro</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {INDUSTRIES.map((ind, i) => (
              <div key={i} className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-[#00D4FF]/30 transition-all flex flex-col items-center gap-3 group cursor-default">
                <ind.icon size={20} className="text-slate-600 group-hover:text-[#00D4FF] transition-colors" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase tracking-widest">{ind.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTES SECTION */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {AGENTS.map((agent, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="p-10 rounded-[48px] bg-[#0A0A0F] border border-white/5 relative overflow-hidden"
            >
              <agent.icon size={32} style={{ color: agent.color }} className="mb-6" />
              <h3 className="text-2xl font-black text-white mb-2">{agent.name}</h3>
              <p className="text-slate-500 text-xs font-bold leading-relaxed">{agent.role}</p>
              <div className="absolute top-0 right-0 p-8 opacity-5"><agent.icon size={100} /></div>
            </motion.div>
          ))}
        </div>
      </section>

      <ModulesSection />

      {/* PRICING FLASH SECTION */}
      <section className="py-32 bg-gradient-to-b from-transparent via-[#00D4FF]/5 to-transparent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block p-12 rounded-[56px] bg-[#0A0A0F] border border-[#00D4FF]/20 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-[#00D4FF]" />
            <h2 className="text-6xl font-black text-white mb-4">S/ 235 <span className="text-xl text-slate-500">mensual</span></h2>
            <p className="text-[#00D4FF] font-mono text-xs tracking-widest uppercase mb-8">S/ 199 + IGV | Incluye 3 submódulos estratégicos de por vida</p>
            <Link 
              href="/registro"
              className="px-12 py-6 rounded-full bg-[#00D4FF] text-black font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-all inline-flex items-center gap-3"
            >
              Solicitar Activación <CheckCircle2 size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* FLOATING WHATSAPP */}
      <a 
        href="https://wa.me/51991740590"
        target="_blank"
        className="fixed bottom-10 right-10 z-50 p-5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all backdrop-blur-xl group shadow-2xl"
      >
        <MessageCircle size={24} />
      </a>
    </main>
  );
}
