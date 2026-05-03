import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { 
  ArrowRight, Zap, Target, ShieldCheck, Plus, 
  Globe, BarChart, ChevronRight, Layout, Database, 
  Search, Users, Activity, Home, Truck, Gavel, 
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import AxiaChatWidget from '@/components/chat/AxiaChatWidget'

/**
 * Premium Marketing Portal for AxyntraX Automation.
 * 6 Strategic Sections for maximum clarity and conversion.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-outfit">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <BrandLogo size="md" />
        </div>
        <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
           <a href="#problems" className="hover:text-[#00BCD4] transition-colors">Soluciones</a>
           <a href="#sectors" className="hover:text-[#00BCD4] transition-colors">Módulos</a>
           <a href="#differentiation" className="hover:text-[#00BCD4] transition-colors">Diferencial</a>
           <Link 
             to="/configurator" 
             className="px-6 py-3 bg-[#00BCD4]/10 border border-[#00BCD4]/20 text-[#00BCD4] rounded-xl hover:bg-[#00BCD4]/20 transition-all font-bold"
           >
              Configurador Pro
           </Link>
        </div>
        <div className="md:hidden">
          <Link to="/dashboard" className="p-2 text-[#00BCD4]">
             <Zap className="w-6 h-6 fill-current" />
          </Link>
        </div>
      </nav>

      {/* SECTION 1: HERO - Identity & Vision */}
      <section className="pt-52 pb-32 px-6 md:px-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-[#00BCD4]/5 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
        
        <div className="max-w-6xl mx-auto text-center space-y-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-5 py-2 bg-slate-50 border border-slate-200 rounded-full"
          >
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00BCD4]">El Futuro de la Gestión Autónoma</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] uppercase text-slate-900"
          >
            AxyntraX <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Automation.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 font-normal max-w-2xl mx-auto leading-relaxed"
          >
            La plataforma modular definitiva que orquesta cada aspecto de su negocio. 
            Del control financiero a la logística crítica, todo en una sola interfaz inteligente.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
          >
            <Link 
              to="/dashboard" 
              className="px-12 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-[#00BCD4] hover:shadow-[#00BCD4]/30 hover:scale-[1.02] transition-all"
            >
              Iniciar Centro de Mando
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM - Pain Points Resolved */}
      <section id="problems" className="py-32 px-6 md:px-10 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">¿Qué resolvemos?</h2>
              <p className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                 Eliminamos el Caos de la <br /> <span className="text-[#00BCD4]">Fragmentación Operativa.</span>
              </p>
              <p className="text-slate-500 text-lg leading-relaxed">
                 Muchas empresas sufren con datos dispersos, procesos manuales propensos a errores y una falta total de visibilidad ejecuiva inmediata.
              </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Caos de Datos', desc: 'Sincronizamos información entre departamentos en tiempo real.', icon: Database },
                { title: 'Lógica Manual', icon: Zap, desc: 'Automatizamos tareas repetitivas con inteligencia predictiva.' },
                { title: 'Falta de Control', icon: Target, desc: 'Centro de mando unificado para decisiones basadas en datos.' },
                { title: 'Riesgo Crítico', icon: ShieldCheck, desc: 'Auditoría Sentinel que valida cada acción de forma inmutable.' }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                   <item.icon className="w-8 h-8 text-[#00BCD4] mb-4" />
                   <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-slate-800">{item.title}</h4>
                   <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* SECTION 3: MODULAR ECOSYSTEM - The 6 Specific Verticals */}
      <section id="sectors" className="py-32 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
           <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#00BCD4]">Verticales Certificadas</h2>
           <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Diseñado para cada <br /> <span className="text-slate-400">Industria Crítica.</span>
           </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { name: 'Residencial', icon: Home, desc: 'Administración de condominios con transparencia y recaudación automática.' },
             { name: 'Médico', icon: Activity, desc: 'Gestión clínica de alta fidelidad, historias y automatización de pacientes.' },
             { name: 'Veterinario', icon: Plus, desc: 'Cuidado animal inteligente con gestión de inventarios y citas proactivas.' },
             { name: 'Dental', icon: Zap, desc: 'Precisión operativa para clínicas dentales con enfoque en retención.' },
             { name: 'Legal', icon: Gavel, desc: 'Monitoreo de expedientes y gestión judicial autónoma para estudios jurídicos.' },
             { name: 'Logístico', icon: Truck, desc: 'Optimización de flotas, seguimiento de carga y control financiero real-time.' },
           ].map((sec, i) => (
             <motion.div 
                key={i} 
                whileHover={{ y: -8 }}
                className="bg-slate-50 border border-slate-100 p-10 rounded-[2.5rem] hover:border-[#00BCD4]/40 hover:bg-white hover:shadow-2xl transition-all group"
             >
                <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 text-[#00BCD4] group-hover:bg-[#00BCD4] group-hover:text-white transition-all`}>
                   <sec.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">{sec.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                   {sec.desc}
                </p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* SECTION 4: DIFFERENTIATION - Why AxyntraX? */}
      <section id="differentiation" className="py-32 px-6 md:px-10 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 space-y-10">
               <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#00BCD4]">El Diferencial AxyntraX</h2>
               <p className="text-4xl md:text-5xl font-black leading-tight">
                  Más que un Software. <br /> Es un <span className="text-[#00BCD4]">Sistema de Mando.</span>
               </p>
               <div className="space-y-6">
                  {[
                    'Interfaz Unificada: Una sola pantalla para múltiples verticales.',
                    'Auditoría Sentinel: Registro inmutable de cada decisión financiera.',
                    'Estética Diamante: Optimización visual para el enfoque ejecutivo.',
                    'Autonomía Real: Procesos que corren 24/7 sin supervisión constante.'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-4">
                       <div className="w-5 h-5 rounded-full bg-[#00BCD4]/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-[#00BCD4]" />
                       </div>
                       <p className="text-slate-400 text-sm md:text-base font-medium">{feat}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="lg:w-1/2 relative">
               <div className="aspect-square bg-gradient-to-br from-[#00BCD4]/20 to-transparent rounded-full animate-pulse blur-3xl absolute inset-0 -z-10" />
               <div className="p-12 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                     <BarChart className="w-8 h-8 text-[#00BCD4]" />
                     <h4 className="text-xl font-black uppercase">Intelligence Hub</h4>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#00BCD4] w-2/3" />
                  </div>
                  <p className="text-slate-500 text-sm italic">"AxyntraX ha reducido nuestra fricción de datos en un 40% en solo un trimestre comercial."</p>
               </div>
            </div>
        </div>
      </section>

      {/* SECTION 5: PROCESS - How to Start */}
      <section className="py-32 px-6 md:px-10 max-w-5xl mx-auto text-center">
        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#00BCD4] mb-12">Cómo Empezar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
           {[
             { step: '01', title: 'Selecciona Vertical', desc: 'Elige el módulo específico para tu industria.' },
             { step: '02', title: 'Configura', desc: 'Personaliza tu centro de mando en minutos.' },
             { step: '03', title: 'Lanza', desc: 'Despliega la suite y toma el control total.' }
           ].map((item, i) => (
             <div key={i} className="space-y-6 relative z-10">
                <div className="w-16 h-16 rounded-full border border-slate-200 bg-white mx-auto flex items-center justify-center text-xl font-black text-slate-800 shadow-sm">
                   {item.step}
                </div>
                <h4 className="text-lg font-black uppercase">{item.title}</h4>
                <p className="text-slate-500 text-sm">{item.desc}</p>
                {i < 2 && <ArrowRight className="hidden md:block w-6 h-6 text-slate-200 absolute top-8 -right-6" />}
             </div>
           ))}
        </div>
      </section>

      {/* SECTION VIDEO: AxyntraX en Acción */}
      <section className="py-24 px-6 md:px-10 bg-slate-900 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4]/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00BCD4]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block text-[11px] font-black uppercase tracking-[0.4em] text-[#00BCD4] mb-4">
              AxyntraX en Acción
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Mira el Sistema<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">
                Trabajar por Ti.
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
              Una sola plataforma. Todos tus módulos. Inteligencia gerencial 24/7.
            </p>
          </motion.div>

          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-[#00BCD4]/10 border border-white/10"
          >
            {/* Glow ring */}
            <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br from-[#00BCD4]/40 via-transparent to-transparent pointer-events-none z-10" />
            <video
              className="w-full aspect-video object-cover bg-black"
              src="/axyntrax-promo.mp4"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => { e.target.currentTime = 1 }}
            >
              Tu navegador no soporta reproducción de video HTML5.
            </video>
          </motion.div>

          {/* Stats bajo el video */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-6 mt-10"
          >
            {[
              { value: '6+',   label: 'Verticales Integradas' },
              { value: '24/7', label: 'Automatización Activa' },
              { value: '100%', label: 'Control Gerencial' },
            ].map(({ value, label }, i) => (
              <div key={i} className="text-center p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-3xl font-black text-[#00BCD4] mb-1">{value}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 6: CLOSING / CTA */}
      <section className="py-32 px-6 md:px-10 bg-[#00BCD4]/5 border-t border-[#00BCD4]/10 text-center">
         <div className="max-w-3xl mx-auto space-y-12">
            <p className="text-3xl md:text-4xl font-black text-slate-900 uppercase">
               ¿Listo para la <span className="text-[#00BCD4]">Autonomía Total?</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
               <Link 
                 to="/configurator" 
                 className="px-10 py-5 bg-[#00BCD4] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#00BCD4]/30 hover:scale-[1.02] transition-all"
               >
                 Abrir Configurador Pro
               </Link>
               <a 
                 href="https://wa.me/51991740590?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20AxyntraX%20Automation"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="px-10 py-5 bg-[#25D366] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] hover:shadow-xl hover:shadow-[#25D366]/30 transition-all flex items-center justify-center gap-3"
               >
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                 Contactar por WhatsApp
               </a>
               <Link 
                 to="/dashboard" 
                 className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all"
               >
                 Demo en Vivo
               </Link>
            </div>
         </div>
      </section>

      {/* AXIA Chat Widget — Agente B2B flotante */}
      <AxiaChatWidget />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/51991740590?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20AxyntraX%20Automation"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-28 right-5 z-40 w-12 h-12 bg-[#25D366] rounded-full shadow-2xl shadow-[#25D366]/40 flex items-center justify-center hover:scale-110 transition-all"
        title="Contactar a AxyntraX por WhatsApp"
      >
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-1 space-y-4">
              <BrandLogo size="sm" />
              <p className="text-slate-400 text-xs leading-relaxed">
                Automatización con IA para MYPEs y clínicas del Perú.
              </p>
              <a href="https://wa.me/51991740590" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black text-[#25D366] hover:underline">
                +51 991 740 590
              </a>
            </div>
            {/* Empresa */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Empresa</h4>
              <ul className="space-y-3">
                {[
                  { to: '/nosotros',  label: 'Nosotros' },
                  { to: '/blog',      label: 'Blog' },
                  { to: '/partners',  label: 'Partners' },
                  { to: '/contacto',  label: 'Contacto' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-xs text-slate-400 hover:text-[#00BCD4] transition-colors font-medium">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Legal & Soporte */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Legal & Soporte</h4>
              <ul className="space-y-3">
                {[
                  { to: '/terminos',            label: 'Términos de Servicio' },
                  { to: '/privacidad',           label: 'Política de Privacidad' },
                  { to: '/sunat-homologacion',   label: 'Homologación SUNAT' },
                  { to: '/ayuda',                label: 'Centro de Ayuda' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-xs text-slate-400 hover:text-[#00BCD4] transition-colors font-medium">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Plataforma */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Plataforma</h4>
              <ul className="space-y-3">
                {[
                  { to: '/dashboard',      label: 'Dashboard' },
                  { to: '/modules',        label: 'Módulos Verticales' },
                  { to: '/pricing',        label: 'Planes y Precios' },
                  { to: '/configurator',   label: 'Configurador Pro' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-xs text-slate-400 hover:text-[#00BCD4] transition-colors font-medium">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              © 2026 AXYNTRAX AUTOMATION S.A.C. · Todos los derechos reservados · Lima, Perú
            </p>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Link to="/terminos" className="hover:text-[#00BCD4] transition-colors">Términos</Link>
              <Link to="/privacidad" className="hover:text-[#00BCD4] transition-colors">Privacidad</Link>
              <a href="https://wa.me/51991740590" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
