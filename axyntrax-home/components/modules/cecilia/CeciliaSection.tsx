"use client";

import { MessageCircle, Globe, Bot, Sparkles, CalendarCheck, Wallet, BellRing, ClipboardList, Database, Briefcase } from "lucide-react";

const CHANNELS = [
  { label: "WhatsApp", color: "#25D366", bg: "#25D36615", icon: <MessageCircle size={16} /> },
  { 
    label: "Instagram", color: "#E1306C", bg: "#E1306C15", 
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ) 
  },
  { 
    label: "Facebook", color: "#1877F2", bg: "#1877F215", 
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z" />
      </svg>
    ) 
  },
  { label: "Web Chat", color: "#00D4FF", bg: "#00D4FF15", icon: <Globe size={16} /> },
];

const FEATURES = [
  { icon: CalendarCheck, title: "Agenda Citas", desc: "Sincronización bidireccional de calendarios sin dobles reservas." },
  { icon: Wallet, title: "Cobra Adelantos", desc: "Envío de links de pago integrados en el flujo de conversación." },
  { icon: BellRing, title: "Recordatorios", desc: "Avisos 24 y 1 hora antes para reducir ausencias." },
  { icon: ClipboardList, title: "Encuestas", desc: "Recolecta feedback automático post-atención (NPS, CSAT)." },
  { icon: Database, title: "Arquitectura Firebase", desc: "Infraestructura robusta en la nube de Google para velocidad y seguridad." },
  { icon: Briefcase, title: "Adaptación por Rubro", desc: "Personalidad e instrucciones configuradas 100% para tu industria." },
];

export default function CeciliaSection() {
  return (
    <section id="cecilia" className="relative py-28 overflow-hidden bg-[#0A0A0F]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(123,47,255,0.06) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div className="absolute right-0 bottom-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="section-label">Cecilia IA Omnicanal</span>
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-widest text-green-400 bg-green-400/10 border border-green-400/20">
                ACTIVA 24/7
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-white">
              Automatiza <span className="text-gradient-violet">cada paso</span> de tu atención
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10">
              Cecilia no es un bot de respuestas predefinidas. Es la inteligencia artificial maestra de AXYNTRAX que orquesta 13 soluciones especializadas, comprendiendo y atendiendo en todos tus canales simultáneamente.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#1A1A2E] border border-white/10">
                      <Icon size={18} className="text-[#00D4FF]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">{feat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
                Presencia Unificada en:
              </p>
              <div className="flex flex-wrap gap-3">
                {CHANNELS.map((ch) => (
                  <div key={ch.label}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 cursor-default"
                    style={{ background: ch.bg, border: `1px solid ${ch.color}30`, color: ch.color }}
                  >
                    {ch.icon}
                    {ch.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Visual Chat Interface */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[340px] h-[340px] rounded-full border border-[#00D4FF]/10 animate-spin-slow" />
              <div className="absolute w-[260px] h-[260px] rounded-full border border-[#7B2FFF]/20 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }} />
            </div>

            <div className="relative z-10 w-full max-w-[340px] rounded-2xl bg-[#0F0F1A] border border-white/10 shadow-2xl overflow-hidden shadow-[#00D4FF]/5">
              {/* Fake Phone Header */}
              <div className="px-5 py-4 border-b border-white/5 bg-black/40 flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00D4FF] to-[#7B2FFF] flex items-center justify-center shadow-lg shadow-[#00D4FF]/20">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0F0F1A]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm leading-tight">Cecilia IA</h4>
                  <p className="text-xs text-slate-400">Atención 24/7</p>
                </div>
                <Sparkles size={16} className="text-[#00D4FF] animate-pulse" />
              </div>

              {/* Fake Chat Body */}
              <div className="p-5 space-y-4 max-h-[360px] overflow-hidden bg-[#0A0A0F]/50">
                <div className="flex justify-end">
                  <div className="bg-[#1A1A2E] border border-white/5 text-white text-xs px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%]">
                    Hola, necesito agendar una cita para mi mascota y saber si puedo pagar un adelanto.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#E2E8F0] text-xs px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] leading-relaxed">
                    ¡Hola! Claro que sí 🐾. Tengo turnos hoy a las 4:00 PM o mañana a las 10:00 AM. 
                    <br/><br/>
                    Para confirmar, te enviaré un link seguro de pago por S/20 como adelanto. ¿Qué horario prefieres?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#1A1A2E] border border-white/5 text-white text-xs px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%]">
                    Hoy a las 4:00 PM por favor.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#E2E8F0] text-xs px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] leading-relaxed">
                    ¡Perfecto! Tu cita está pre-agendada 📅. 
                    <br/><br/>
                    🔗 Paga tu adelanto aquí: <span className="text-[#00D4FF] underline">link.axyntrax.com/pay</span>
                    <br/><br/>
                    Te enviaré un recordatorio automático 1 hora antes.
                  </div>
                </div>
              </div>

              {/* Chat Input Fake */}
              <div className="p-4 bg-black/40 border-t border-white/5 flex items-center gap-3">
                <div className="flex-1 h-9 rounded-full bg-white/5 border border-white/5 px-4 flex items-center text-xs text-slate-500">
                  Escribe un mensaje...
                </div>
                <div className="w-9 h-9 rounded-full bg-[#7B2FFF] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
