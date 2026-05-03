import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, Monitor, ShieldCheck, Zap } from 'lucide-react';
import { bus } from '@/lib/orchestrator/OrchestratorBus';

const demoSteps = [
  { 
    title: 'Dashboard Maestro', 
    desc: 'Visualice el estado de su negocio en tiempo real con nuestra interfaz premium.',
    icon: Monitor,
    image: 'https://placehold.co/600x400/000000/FFFFFF?text=Dashboard+Maestro'
  },
  { 
    title: 'IA Operativa Axia', 
    desc: 'Su asistente inteligente detecta problemas y sugiere soluciones antes de que ocurran.',
    icon: Zap,
    image: 'https://placehold.co/600x400/000000/FFFFFF?text=IA+Axia+Operativa'
  },
  { 
    title: 'Control de Seguridad', 
    desc: 'Acceso corporativo blindado con validación de licencias Keygen en cada módulo.',
    icon: ShieldCheck,
    image: 'https://placehold.co/600x400/000000/FFFFFF?text=Seguridad+Total'
  }
];

export default function DemoInteractiva({ botId = 'generic' }) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < demoSteps.length - 1) {
      setStep(s => s + 1);
      bus.emit({
        agente: 'IASalesWeb',
        evento: 'DEMO_STEP_COMPLETED',
        datos: { botId, step: step + 1, total: demoSteps.length },
        prioridad: 'info'
      });
    } else {
      bus.emit({
        agente: 'IASalesWeb',
        evento: 'DEMO_FINISHED',
        datos: { botId },
        prioridad: 'media'
      });
      alert('¡Demo finalizada! Redirigiendo a contratación...');
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto backdrop-blur-md">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">Tour Interactivo</h3>
             <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                Explorando: <span className="text-[#8b5cf6]">{botId.toUpperCase()}</span>
             </p>
          </div>
          <div className="flex gap-1">
             {demoSteps.map((_, i) => (
                <div key={i} className={cn(
                  "w-8 h-1 rounded-full transition-all",
                  i <= step ? "bg-[#8b5cf6]" : "bg-white/10"
                )} />
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             <div className="aspect-video bg-black/60 rounded-2xl border border-white/5 overflow-hidden relative group">
                <img src={demoSteps[step].image} alt="Step visual" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                   <div className="w-10 h-10 bg-[#8b5cf6] rounded-xl flex items-center justify-center text-white">
                      {React.createElement(demoSteps[step].icon, { className: "w-5 h-5" })}
                   </div>
                   <h4 className="text-white font-black uppercase text-sm">{demoSteps[step].title}</h4>
                </div>
             </div>

             <p className="text-sm text-white/60 leading-relaxed font-bold uppercase italic">
                "{demoSteps[step].desc}"
             </p>
          </motion.div>
       </AnimatePresence>

       <div className="mt-10 flex items-center justify-between">
          <button 
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors disabled:opacity-0"
          >
             <ChevronLeft className="w-4 h-4" /> <span className="text-[10px] font-black uppercase">Anterior</span>
          </button>
          
          <button 
            onClick={nextStep}
            className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#8b5cf6] hover:text-white transition-all flex items-center gap-2"
          >
             {step < demoSteps.length - 1 ? 'Siguiente Paso' : 'Contratar Ahora'} <ChevronRight className="w-4 h-4" />
          </button>
       </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
