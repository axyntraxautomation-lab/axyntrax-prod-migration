'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { CeciliaFloatingBot } from '@/components/CeciliaFloatingBot';
import { WspFloatingButton } from '@/components/WspFloatingButton';
import FAQSection from '@/components/FAQSection';
import ModulesSection from '@/components/ModulesSection';
import CeciliaSection from '@/components/CeciliaSection';
import AgentsSection from '@/components/AgentsSection';
import { 
  ShieldCheck, 
  Zap, 
  Target, 
  Users, 
  ChevronDown, 
  CheckCircle2, 
  MessageCircle,
  Lock,
  FileText,
  HelpCircle,
  Globe,
  ArrowRight
} from 'lucide-react';

// --- COMPONENTES INTERNOS ---

const SectionTitle = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="text-center mb-16">
    <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">{title}</h2>
    <div className="h-1 w-20 bg-[#00D4FF] mx-auto mt-4 mb-4 rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
    <p className="text-slate-500 max-w-2xl mx-auto">{subtitle}</p>
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:border-[#00D4FF]/30 transition-all ${className}`}>
    {children}
  </div>
);

// --- MAIN PAGE ---

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-[#00D4FF]/30">
      <WspFloatingButton />
      <CeciliaFloatingBot />
      
      {/* SPLASH OVERLAY */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-[100] bg-[#0A0A0F] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <Logo size={200} />
              <p className="mt-6 font-mono text-[10px] tracking-[0.4em] text-[#00D4FF] animate-pulse">SISTEMA_CARGANDO</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5 py-4 px-8 flex justify-between items-center">
        <Logo size={40} className="scale-75 origin-left" />
        <div className="hidden md:flex gap-8 text-[11px] font-mono uppercase tracking-widest text-slate-400">
          <a href="#nosotros" className="hover:text-[#00D4FF] transition-colors">Nosotros</a>
          <a href="#modulos" className="hover:text-[#00D4FF] transition-colors">Módulos</a>
          <a href="#faq" className="hover:text-[#00D4FF] transition-colors">FAQ</a>
          <a href="#contacto" className="hover:text-[#00D4FF] transition-colors">Contacto</a>
        </div>
        <a href="/login" className="bg-[#00D4FF] text-black font-bold px-6 py-2 rounded-full text-xs hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all">ACCESO CLIENTE</a>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-8 flex flex-col items-center text-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl w-full flex flex-col items-center"
        >
          <span className="inline-block py-1 px-4 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] text-[10px] font-mono mb-12 border border-[#00D4FF]/20 tracking-[0.3em]">IA_ECOSYSTEM_ACTIVE // 30_DIAS_GRATIS</span>
          
          {/* GIANT BRAND IDENTITY */}
          <div className="relative group mb-8">
            <Logo size={400} className="drop-shadow-[0_0_50px_rgba(0,212,255,0.15)] group-hover:drop-shadow-[0_0_70px_rgba(0,212,255,0.25)] transition-all duration-700" />
            <h1 className="sr-only">Axyntrax Automation Suite</h1>
          </div>

          <h2 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter leading-[1] max-w-4xl">
            Automatizando el <span className="bg-gradient-to-r from-[#00D4FF] to-[#0088FF] bg-clip-text text-transparent">Crecimiento</span> de tu Empresa
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <a href="/registro" className="px-12 py-5 bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF] rounded-2xl font-black text-xl hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:scale-105 transition-all flex items-center gap-3">EMPEZAR DEMO 30 DÍAS <ArrowRight size={24} /></a>
            <a href="#modulos" className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xl hover:bg-white/10 transition-all">EXPLORAR MÓDULOS</a>
          </div>
        </motion.div>
        
        {/* Glow Effects */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#00D4FF]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-[#7B2FFF]/10 blur-[150px] rounded-full" />
      </section>

      {/* NOSOTROS - MISIÓN / VISIÓN / VALORES */}
      <section id="nosotros" className="py-24 px-8 max-w-7xl mx-auto">
        <SectionTitle title="Nuestra Esencia" subtitle="Construimos el futuro de la gestión empresarial automatizada en el Perú. Orgullosamente arequipeños." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-2xl flex items-center justify-center text-[#00D4FF] mb-6"><Target size={24} /></div>
            <h3 className="text-xl font-bold mb-4">Nuestra Historia</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Nacimos en Arequipa automatizando talleres mecánicos. Hoy, nuestra suite gestiona múltiples rubros en Lima, Arequipa, Cusco y Trujillo, democratizando la IA para el empresario peruano.</p>
          </Card>
          <Card>
            <div className="w-12 h-12 bg-[#7B2FFF]/10 rounded-2xl flex items-center justify-center text-[#7B2FFF] mb-6"><Globe size={24} /></div>
            <h3 className="text-xl font-bold mb-4">Nuestra Visión</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Ser la plataforma de automatización líder en Latinoamérica, transformando empresas tradicionales en entidades autónomas de alto rendimiento a través de nuestra red de agentes IA.</p>
          </Card>
          <Card>
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-2xl flex items-center justify-center text-[#00D4FF] mb-6"><Users size={24} /></div>
            <h3 className="text-xl font-bold mb-4">Misión</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Democratizar la Inteligencia Artificial avanzada para PYMES peruanas, permitiendo que cada negocio cuente con un orquestador digital capaz de gestionar operaciones complejas.</p>
          </Card>
        </div>
      </section>

      {/* CECILIA IA SECTION */}
      <CeciliaSection />

      {/* AGENTES IA SECTION */}
      <AgentsSection />

      {/* MÓDULOS DE VENTA */}
      <ModulesSection />

      {/* FAQ SECTION */}
      <FAQSection />

      {/* FOOTER - POLÍTICAS Y PRIVACIDAD */}
      <footer id="contacto" className="bg-black border-t border-white/5 pt-20 pb-10 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <Logo size={50} className="mb-6 origin-left" />
            <p className="text-slate-500 text-sm max-w-sm mb-8">
              Líderes en orquestación empresarial con Inteligencia Artificial. Transformando el Perú, un negocio a la vez.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#00D4FF]/20 transition-all cursor-pointer"><MessageCircle size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#00D4FF]/20 transition-all cursor-pointer"><Globe size={18} /></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest mb-6">Políticas</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="/privacidad" className="hover:text-white flex items-center gap-2"><Lock size={14} /> Privacidad</a></li>
              <li><a href="/terminos" className="hover:text-white flex items-center gap-2"><ShieldCheck size={14} /> Términos de Uso</a></li>
              <li><a href="/contacto" className="hover:text-white flex items-center gap-2"><FileText size={14} /> Cookies</a></li>
              <li><a href="/terminos" className="hover:text-white flex items-center gap-2"><CheckCircle2 size={14} /> Ética IA</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest mb-6">Empresa</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#nosotros" className="hover:text-white">Nosotros</a></li>
              <li><a href="https://wa.me/51991740590" className="hover:text-white">Soporte CEO</a></li>
              <li><a href="/login" className="hover:text-white">Portal Jarvis</a></li>
              <li><a href="/registro" className="hover:text-white">Socio AXYNTRAX</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">© 2026 AXYNTRAX AUTOMATION SUITE. TODOS LOS DERECHOS RESERVADOS.</p>
          <div className="flex gap-8 text-[10px] font-mono text-slate-700 uppercase">
            <span>RUC: 10406750324</span>
            <span>AREQUIPA, PERÚ (SEDE CENTRAL)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
