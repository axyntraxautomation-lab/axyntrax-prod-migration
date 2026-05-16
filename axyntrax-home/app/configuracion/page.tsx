'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { 
  Building2, 
  Layers, 
  Settings2, 
  MessageSquare, 
  Clock, 
  Mail, 
  Calendar, 
  Users, 
  CheckCircle2, 
  FileText, 
  PlayCircle,
  QrCode,
  Zap,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Datos Empresa', icon: <Building2 size={20} /> },
  { id: 2, title: 'Activar Módulos', icon: <Layers size={20} /> },
  { id: 3, title: 'Submódulos', icon: <Settings2 size={20} /> },
  { id: 4, title: 'WhatsApp Business', icon: <MessageSquare size={20} /> },
  { id: 5, title: 'Horario Cecilia', icon: <Clock size={20} /> },
  { id: 6, title: 'Correo SMTP', icon: <Mail size={20} /> },
  { id: 7, title: 'Integraciones', icon: <Calendar size={20} /> },
  { id: 8, title: 'Equipo & Roles', icon: <Users size={20} /> },
  { id: 9, title: 'Activación Final', icon: <CheckCircle2 size={20} /> },
];

export default function ConfiguracionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [ceciliaActive, setCeciliaActive] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    setProgress(((currentStep - 1) / (STEPS.length - 1)) * 100);
    setTimer(0); // Reset timer on step change
  }, [currentStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev >= 300) { // 5 minutes (300s)
          setCeciliaActive(true);
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const nextStep = () => currentStep < STEPS.length && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-8">
        <Logo size={40} className="scale-75 origin-left" />
        
        {/* Progress Bar Container */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">
            <span>Progreso de Configuración</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <FileText size={14} /> PDF este paso
          </button>
          <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <PlayCircle size={14} /> Tutorial 60s
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pt-32 pb-20 px-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Step Header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] border border-[#00D4FF]/20 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                {STEPS[currentStep - 1].icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Paso {currentStep}: {STEPS[currentStep - 1].title}</h2>
                <p className="text-slate-500 text-sm italic">Complete la información técnica para orquestar Cecilia IA.</p>
              </div>
            </div>

            {/* Dynamic Step Content */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest">Nombre Comercial</label>
                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00D4FF] transition-all" placeholder="Ej: Clínica Dental San Luis" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest">RUC Empresa</label>
                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00D4FF] transition-all" placeholder="20123456789" />
                  </div>
                  <div className="col-span-2 space-y-4">
                    <label className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest">Logo de su Empresa</label>
                    <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-[#00D4FF] hover:text-white transition-all cursor-pointer">
                      <Zap size={24} className="mb-2" />
                      <span className="text-xs">Subir archivo PNG o SVG</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest">Número WhatsApp Business</label>
                        <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 mt-2 outline-none" placeholder="+51 999 000 000" />
                      </div>
                      <div className="p-6 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-2xl flex items-center gap-4">
                        <QrCode className="text-[#00D4FF]" size={40} />
                        <div>
                          <p className="text-sm font-bold">Vincular con Cecilia</p>
                          <p className="text-[10px] text-slate-400">Escanee el QR de Meta para activar la IA.</p>
                        </div>
                        <button className="ml-auto bg-[#00D4FF] text-black text-[10px] font-bold px-4 py-2 rounded-lg">GENERAR QR</button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-xs font-mono text-[#7B2FFF] uppercase tracking-widest">Configuración de Pagos</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#7B2FFF] transition-all">
                          <span className="text-xs font-bold text-[#7B2FFF]">YAPE / PLIN</span>
                        </div>
                        <div className="h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#7B2FFF] transition-all">
                          <span className="text-xs font-bold text-[#7B2FFF]">CÓDIGO QR</span>
                        </div>
                      </div>
                      <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none">
                        <option>Seleccione Rubro para Cecilia</option>
                        <option>Médico / Dental</option>
                        <option>Estética / Barber</option>
                        <option>Legal / Contable</option>
                        <option>Gastronomía / Rest</option>
                      </select>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all">
                    TEST: ENVIAR MENSAJE "HOLA" DE PRUEBA
                  </button>
                </div>
              )}

              {/* Placeholder for other steps for brevity in Phase 2 */}
              {![1, 4].includes(currentStep) && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Zap size={48} className="animate-pulse mb-6" />
                  <p className="text-lg">Interfaz de {STEPS[currentStep - 1].title} Lista para Configuración</p>
                  <p className="text-xs font-mono mt-2">Firebase Sync Active: status_ok</p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-500 hover:text-white disabled:opacity-0 transition-all"
              >
                <ArrowLeft size={18} /> Volver
              </button>
              
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF] font-bold shadow-[0_0_20px_rgba(123,47,255,0.3)] hover:scale-105 transition-all"
              >
                {currentStep === STEPS.length ? 'ACTIVAR SISTEMA AXYNTRAX' : 'Siguiente Paso'} <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Cecilia Master */}
      <AnimatePresence>
        {(ceciliaActive || currentStep === 1) && (
          <motion.div 
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] group"
          >
            <div className="relative">
              <div className="absolute -top-12 right-0 bg-white p-3 rounded-2xl rounded-br-none text-black text-[10px] font-bold shadow-2xl w-48 border-2 border-[#00D4FF]">
                {ceciliaActive ? 
                  "¡Hola! He notado que te has detenido. ¿Necesitas ayuda orquestando este paso?" : 
                  "Hola, soy Cecilia Master. Estoy aquí para guiarte en tu configuración inicial."
                }
              </div>
              <div className="w-16 h-16 bg-gradient-to-tr from-[#00D4FF] to-[#7B2FFF] rounded-full p-1 shadow-[0_0_25px_rgba(0,212,255,0.5)] cursor-pointer">
                <div className="w-full h-full bg-[#0A0A0F] rounded-full flex items-center justify-center overflow-hidden">
                  <div className="w-10 h-10 bg-[#00D4FF] rounded-full flex items-center justify-center font-bold text-black text-sm">C</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 py-4 px-8 flex justify-between items-center text-[10px] font-mono text-slate-600 bg-[#0A0A0F]/80 backdrop-blur-sm border-t border-white/5">
        <span>AXYNTRAX CORE ENGINE v1.0 // MULTI-TENANT_ACTIVE</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> FIREBASE_SYNC_OK</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> DEEPSEEK_PRO_ACTIVE</span>
        </div>
      </footer>
    </main>
  );
}
