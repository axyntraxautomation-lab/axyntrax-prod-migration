'use client';

import { motion } from "framer-motion";
import { CheckCircle2, Zap, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-[#020204] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">Plan Maestro Unificado</h2>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium">Una sola inversión para el control total de su empresa. Sin costos ocultos.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="p-12 rounded-[56px] bg-[#0A0A0F] border border-[#00D4FF]/30 relative group shadow-2xl shadow-[#00D4FF]/5"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#00D4FF] text-black font-black text-[10px] uppercase tracking-widest rounded-b-2xl">
              EL ESTÁNDAR AXYNTRAX
            </div>

            <div className="text-center mb-12">
              <div className="text-7xl font-black text-white mb-2 flex items-center justify-center gap-4">
                <span className="text-2xl text-slate-500">S/</span> 235
              </div>
              <p className="text-[#00D4FF] font-mono text-xs uppercase tracking-[0.2em] font-black">S/ 199 + IGV / MENSUAL</p>
            </div>

            <div className="space-y-6 mb-12">
              {[
                "3 Submódulos Estratégicos Gratuitos",
                "Soporte Técnico Centralizado Atlas",
                "Cecilia Asist Neural Omnicanal",
                "Dashboard Cecilia Master Gerencial",
                "Reportes Operativos Diarios",
                "Cifrado de Datos Protocolo Alfa"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 text-slate-300">
                  <CheckCircle2 size={18} className="text-[#00D4FF]" />
                  <span className="text-sm font-bold">{feature}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/registro"
              className="w-full py-6 rounded-3xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#00D4FF] transition-all"
            >
              SOLICITAR ACTIVACIÓN <ArrowRight size={16} />
            </Link>

            <p className="mt-8 text-[10px] text-slate-600 text-center uppercase tracking-widest leading-relaxed">
              * Activación en menos de 24 horas tras validación de cuenta.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#00D4FF]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#7B2FFF]/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
    </section>
  );
}
