import { Facebook, Instagram, Linkedin, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#020204] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Logo size={40} className="mb-6" />
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              La orquestación inteligente que tu empresa necesita. Automatización neural para 13 industrias especializadas.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-[#00D4FF] transition-all"><Facebook size={18} /></a>
              <a href="#" className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-[#00D4FF] transition-all"><Instagram size={18} /></a>
              <a href="#" className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-[#00D4FF] transition-all"><Linkedin size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Industrias</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><Link href="/registro" className="hover:text-white transition-all">Médico & Dental</Link></li>
              <li><Link href="/registro" className="hover:text-white transition-all">Legal & Contable</Link></li>
              <li><Link href="/registro" className="hover:text-white transition-all">Automotriz & Flotas</Link></li>
              <li><Link href="/registro" className="hover:text-white transition-all">Restaurantes & Retail</Link></li>
              <li><Link href="/registro" className="hover:text-white transition-all">Ferretería & Bodegas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Agentes</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><span className="text-white font-bold">Cecilia:</span> Atención Neural</li>
              <li><span className="text-white font-bold">Atlas:</span> Seguridad & Salud</li>
              <li><span className="text-white font-bold">JARVIS:</span> Orquestador Privado</li>
              <li><span className="text-white font-bold">Mark:</span> Director de Marketing</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Soporte</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#00D4FF]" /> Soporte Centralizado Atlas</li>
              <li className="flex items-center gap-2"><MessageCircle size={14} className="text-[#00D4FF]" /> Consultoría B2B</li>
              <li>S/ 235 Mensual (S/ 199 + IGV)</li>
              <li className="pt-4">
                <Link href="/registro" className="text-[#00D4FF] font-black text-xs uppercase tracking-widest hover:underline">Solicitar Activación</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © 2026 AXYNTRAX AUTOMATION SUITE. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex gap-8 text-[10px] text-slate-600 uppercase tracking-widest">
            <Link href="/privacidad" className="hover:text-white transition-all">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-all">Términos</Link>
            <Link href="/cookies" className="hover:text-white transition-all">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
