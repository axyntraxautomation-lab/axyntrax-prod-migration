import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowLeft, Zap, Users, Globe, Shield, Bot, BarChart } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <BrandLogo size="sm" />
        <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#00BCD4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4]/10 via-transparent to-transparent pointer-events-none" />
        <motion.div {...fade} className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Users className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">Quiénes Somos</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            Sobre <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">AxyntraX</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Empresa peruana de tecnología especializada en automatización empresarial,
            inteligencia artificial y desarrollo de software SaaS modular.
          </p>
        </motion.div>
      </section>

      {/* Misión */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fade} className="space-y-6">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-[#00BCD4]">Nuestra Misión</span>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              Automatización con IA al alcance de cada empresa peruana
            </h2>
            <p className="text-slate-500 leading-relaxed">
              <strong>AXYNTRAX AUTOMATION</strong> es una empresa peruana de tecnología con sede en Lima, Perú,
              especializada en automatización empresarial, inteligencia artificial y desarrollo de software
              SaaS modular. Nacimos con una misión clara: democratizar el acceso a la tecnología de clase
              mundial para las MYPEs y clínicas del Perú.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Nuestros módulos especializados (VET, MED, LEX, LOGI, DENT, CONDO, REST) están diseñados para
              optimizar la gestión de negocios por sector, incorporando a <strong className="text-slate-800">AXIA</strong>,
              nuestra IA avanzada para contabilidad, reportes financieros y estrategia empresarial.
            </p>
          </motion.div>
          <motion.div {...fade} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
            {[
              { icon: Bot,      label: 'IA Avanzada',       desc: 'AXIA + CECILIA operando 24/7' },
              { icon: Shield,   label: 'Datos Seguros',      desc: 'Ley N° 29733 cumplida' },
              { icon: Globe,    label: 'Alcance Nacional',   desc: 'Disponible en todo Perú' },
              { icon: BarChart, label: 'ROI Comprobado',     desc: 'Resultados desde el día 1' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <Icon className="w-8 h-8 text-[#00BCD4] mb-3" />
                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{label}</p>
                <p className="text-slate-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-[#00BCD4]">Nuestros Módulos</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">6 Verticales Especializadas</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: 'MED',   name: 'MediBot',       desc: 'Gestión de clínicas médicas' },
              { id: 'VET',   name: 'VetBot',         desc: 'Automatización para veterinarias' },
              { id: 'DENT',  name: 'DentBot',        desc: 'Gestión odontológica completa' },
              { id: 'LEX',   name: 'LexBot',         desc: 'Estudios jurídicos digitales' },
              { id: 'CONDO', name: 'CondoBot',       desc: 'Gestión de condominios' },
              { id: 'REST',  name: 'RestaurantBot',  desc: 'Operaciones para restaurantes' },
            ].map(({ id, name, desc }) => (
              <motion.div key={id} whileHover={{ y: -4 }} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#00BCD4]/40 transition-all">
                <span className="text-xs font-black text-[#00BCD4] bg-[#00BCD4]/10 px-2 py-1 rounded-lg">{id}</span>
                <h3 className="font-black text-slate-800 mt-3 mb-1">{name}</h3>
                <p className="text-xs text-slate-500">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AXIA */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div {...fade}>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-[#00BCD4]">Nuestra IA</span>
            <h2 className="text-4xl font-black mt-2">Conoce a <span className="text-[#00BCD4]">AXIA</span></h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
              AXIA es nuestra inteligencia artificial avanzada integrada en la plataforma. Genera reportes
              financieros automáticos, analiza tendencias de negocio, proporciona estrategia empresarial
              en tiempo real y actúa como consultor gerencial 24/7 para cada módulo vertical.
            </p>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
              <strong className="text-white">CECILIA</strong>, nuestro bot de WhatsApp, complementa a AXIA
              atendiendo clientes, agendando citas y calificando leads automáticamente a través de la
              API oficial de WhatsApp Business de Meta.
            </p>
          </motion.div>
          <motion.div {...fade} transition={{ delay: 0.2 }}>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-[#00BCD4] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#00BCD4]/30">
              <Zap className="w-4 h-4" /> Explorar la Plataforma
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50 text-center">
        <BrandLogo size="sm" />
        <div className="flex justify-center gap-6 mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/terminos" className="hover:text-[#00BCD4] transition-colors">Términos</Link>
          <Link to="/privacidad" className="hover:text-[#00BCD4] transition-colors">Privacidad</Link>
          <Link to="/contacto" className="hover:text-[#00BCD4] transition-colors">Contacto</Link>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-4">
          © 2026 AXYNTRAX AUTOMATION. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
