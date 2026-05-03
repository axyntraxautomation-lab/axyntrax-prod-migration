import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Verified } from 'lucide-react';
import { bus } from '@/lib/orchestrator/OrchestratorBus';
import { useI18nStore, t } from '@/lib/i18nStore';
import { OnboardingConfig } from '../OnboardingConfig';

export default function OnboardingWizard() {
  const { language } = useI18nStore();
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = OnboardingConfig.steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    bus.emit({
      agente: 'IAOnboarding',
      evento: 'ONBOARDING_STEP_VIEWED',
      datos: { step: OnboardingConfig.steps[currentStep].id },
      prioridad: 'info'
    });
  }, [currentStep, language]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
    } else {
      bus.emit({
         agente: 'IAOnboarding',
         evento: 'SETUP_FINISHED',
         datos: { lang: language },
         prioridad: 'alta'
      });
      alert(language === 'es' ? '¡Activación Exitosa!' : 'Activation Successful!');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-black/40 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-3xl shadow-2xl">
      {/* Barra de Progreso */}
      <div className="h-1 bg-white/5 w-full relative">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           className="absolute top-0 left-0 h-full bg-[#8b5cf6]"
         />
      </div>

      <div className="p-12 space-y-10">
         <div className="flex justify-between items-start">
            <div className="space-y-1">
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {language === 'es' ? 'Configuración' : 'Setup'} <span className="text-white/40">{currentStep + 1}</span>
               </h2>
               <p className="text-[10px] font-black uppercase text-[#8b5cf6] tracking-widest">
                  {t(OnboardingConfig.steps[currentStep].title, language)}
               </p>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
               <Sparkles className="w-4 h-4 text-amber-400" />
               <p className="text-[9px] font-bold text-white/60 italic max-w-[200px]">
                  "{t(OnboardingConfig.aiMessages[OnboardingConfig.steps[currentStep].id], language) || (language === 'es' ? 'Casi listo...' : 'Almost ready...')}"
               </p>
            </div>
         </div>

         <div className="min-h-[200px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
               <motion.div
                 key={`${currentStep}-${language}`}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                  <p className="text-sm text-white/40 font-bold uppercase tracking-wide">
                     {t(OnboardingConfig.steps[currentStep].desc, language)}
                  </p>

                  {currentStep === 3 && (
                     <div className="text-center py-8 space-y-6">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full mx-auto flex items-center justify-center">
                           <Verified className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                           {language === 'es' ? '¡Despliegue Finalizado!' : 'Deployment Finished!'}
                        </h3>
                     </div>
                  )}
               </motion.div>
            </AnimatePresence>
         </div>

         <div className="flex items-center justify-between pt-10 border-t border-white/5">
            <button 
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 text-white/20 hover:text-white transition-all disabled:opacity-0 text-[10px] font-black uppercase"
            >
               {language === 'es' ? 'Atrás' : 'Back'}
            </button>

            <button 
               onClick={handleNext}
               className="px-10 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-[#8b5cf6] hover:text-white transition-all flex items-center gap-3"
            >
               {currentStep === totalSteps - 1 ? (language === 'es' ? 'Finalizar' : 'Finish') : (language === 'es' ? 'Continuar' : 'Next')} <ChevronRight className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
}
