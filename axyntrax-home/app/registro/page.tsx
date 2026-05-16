'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Building2, Phone } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    nombre: '', 
    empresa: '', 
    telefono: '', 
    termsAccepted: false, 
    privacyAccepted: false, 
    whatsappOptIn: false 
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      }
    } catch (error) {
      console.error('Error in registration:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-lg bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl"
      >
        <button 
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-white text-xs mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Volver al Login
        </button>

        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">Registro de Cliente</h2>
        <p className="text-slate-500 text-center text-sm mb-10">Solicite su acceso a la red de orquestación Axyntrax</p>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-green-500/10 border border-green-500/20 rounded-2xl"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-green-400 mb-2">¡Solicitud Enviada!</h3>
            <p className="text-slate-400 text-sm">Cecilia te enviará tu **KEY de acceso** por WhatsApp en breves momentos. Redirigiendo al login...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <label className="block text-xs font-mono text-[#00D4FF] uppercase tracking-widest">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 focus:border-[#00D4FF] outline-none transition-all"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono text-[#00D4FF] uppercase tracking-widest">Empresa / RUC</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text"
                  value={form.empresa}
                  onChange={(e) => setForm({...form, empresa: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 focus:border-[#00D4FF] outline-none transition-all"
                  placeholder="Axyntrax S.A.C."
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono text-[#00D4FF] uppercase tracking-widest">Teléfono WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({...form, telefono: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 focus:border-[#00D4FF] outline-none transition-all"
                  placeholder="51991740590"
                  required
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={form.termsAccepted}
                  onChange={(e) => setForm({...form, termsAccepted: e.target.checked})}
                  className="mt-1 w-4 h-4 rounded border-white/10 bg-black/50 text-[#00D4FF] focus:ring-[#00D4FF]"
                  required
                />
                <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight">
                  Acepto los <a href="/terminos" target="_blank" className="text-[#00D4FF] hover:underline">Términos y Condiciones</a> y entiendo que mi actividad operativa será auditada para garantizar la seguridad del sistema.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="privacy"
                  checked={form.privacyAccepted}
                  onChange={(e) => setForm({...form, privacyAccepted: e.target.checked})}
                  className="mt-1 w-4 h-4 rounded border-white/10 bg-black/50 text-[#00D4FF] focus:ring-[#00D4FF]"
                  required
                />
                <label htmlFor="privacy" className="text-[11px] text-slate-400 leading-tight">
                  He leído la <a href="/privacidad" target="_blank" className="text-[#00D4FF] hover:underline">Política de Privacidad</a> y autorizo el tratamiento de mis datos corporativos bajo estándares de cifrado.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="whatsapp"
                  checked={form.whatsappOptIn}
                  onChange={(e) => setForm({...form, whatsappOptIn: e.target.checked})}
                  className="mt-1 w-4 h-4 rounded border-white/10 bg-black/50 text-[#00D4FF] focus:ring-[#00D4FF]"
                  required
                />
                <label htmlFor="whatsapp" className="text-[11px] text-slate-400 leading-tight">
                  Autorizo la atención automatizada vía Cecilia IA para la entrega de licencias, soporte y notificaciones operativas.
                </label>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4 mt-4">
              <button 
                type="submit"
                disabled={loading || !form.termsAccepted || !form.privacyAccepted || !form.whatsappOptIn}
                className="w-full bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF] text-white font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(123,47,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'PROCESANDO SOLICITUD...' : 'ENVIAR SOLICITUD DE LICENCIA'}
              </button>
              <p className="text-[10px] text-slate-500 text-center italic">
                * Su solicitud será evaluada por el CEO JARVIS. Se le notificará por WhatsApp con su KEY de acceso.
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}
