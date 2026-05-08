import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowLeft, HelpCircle, ChevronDown, MessageSquare, Zap } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const FAQS = [
  {
    cat: 'Módulos y Uso',
    color: '#00BCD4',
    items: [
      { q: '¿Cómo activo un módulo (MediBot, VetBot, DentBot, etc.)?', a: 'Al contratar tu plan, recibirás una clave KEYGE por WhatsApp o correo. Ingresa la clave en el panel de configuración y el módulo se activará automáticamente. La implementación toma menos de 24 horas.' },
      { q: '¿Puedo tener varios módulos activos al mismo tiempo?', a: 'Sí. El plan Pro incluye hasta 3 módulos verticales simultáneos y el plan Diamante incluye acceso ilimitado a todos los módulos.' },
      { q: '¿Cuántos usuarios pueden usar la plataforma?', a: 'El plan Starter incluye hasta 3 usuarios, Pro hasta 10 usuarios y Diamante usuarios ilimitados. Puedes agregar usuarios adicionales con un cargo extra.' },
      { q: '¿Funciona en celulares y tablets?', a: 'Sí. La plataforma es completamente responsive. Puedes acceder desde cualquier navegador en celular, tablet o computadora.' },
    ],
  },
  {
    cat: 'Pagos y Suscripción',
    color: '#8B5CF6',
    items: [
      { q: '¿Cuáles son los planes disponibles y sus precios?', a: 'Starter: S/ 235/mes (1 módulo, 3 usuarios). Pro: S/ 471/mes (3 módulos, 10 usuarios). Diamante: S/ 825/mes (todos los módulos, ilimitado). Todos los precios incluyen IGV 18%.' },
      { q: '¿Cómo realizo el pago?', a: 'Aceptamos transferencias bancarias, Yape, Plin y depósitos. Después del pago, enviamos la clave KEYGE y acceso al dashboard en menos de 24 horas.' },
      { q: '¿Hay período de prueba gratuito?', a: 'Ofrecemos una demostración personalizada gratuita de 30 minutos donde mostramos el sistema en vivo. Contáctanos por WhatsApp para coordinar.' },
      { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. Puedes cancelar notificando con 15 días de anticipación a legal@axyntrax-automation.com. No se realizan reembolsos proporcionales por el período restante prepagado.' },
    ],
  },
  {
    cat: 'AXIA — Inteligencia Artificial',
    color: '#FFD700',
    items: [
      { q: '¿Qué puede hacer AXIA por mi negocio?', a: 'AXIA genera reportes financieros automáticos, analiza tendencias de tu negocio, responde preguntas sobre el estado de tu empresa, ayuda a tomar decisiones gerenciales y actúa como consultor 24/7 integrado en tu panel.' },
      { q: '¿AXIA puede equivocarse en sus respuestas?', a: 'Los modelos de IA son probabilísticos y pueden generar respuestas inexactas. Toda decisión importante debe ser validada por un profesional humano. AxyntraX no es responsable por decisiones tomadas exclusivamente en base a respuestas de IA.' },
      { q: '¿Qué tecnología usa AXIA?', a: 'AXIA está construida sobre Google Gemini 2.0 Flash, el modelo de IA más avanzado de Google, combinado con la lógica de negocio específica de cada módulo vertical.' },
    ],
  },
  {
    cat: 'Soporte Técnico',
    color: '#10B981',
    items: [
      { q: '¿Cuál es el horario de soporte?', a: 'CECILIA (bot IA) responde 24/7 automáticamente. Soporte humano: lunes a viernes de 9am a 6pm (hora Perú). Urgencias críticas tienen atención prioritaria.' },
      { q: '¿Cómo reporto un problema técnico?', a: 'Por WhatsApp al +51 991 740 590 o por correo a axyntraxautomation@gmail.com. Describe el problema y, de ser posible, adjunta una captura de pantalla.' },
      { q: '¿Cómo accedo al sistema si olvidé mi contraseña?', a: 'En la pantalla de login, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu correo registrado. Recibirás un enlace de recuperación. Si tienes problemas, contáctanos por WhatsApp.' },
      { q: '¿Mis datos están seguros en AxyntraX?', a: 'Sí. Toda la información se transmite con cifrado TLS/HTTPS. Las contraseñas se almacenan con hash SHA-256. Tenemos backups periódicos y cumplimos la Ley N° 29733 de Protección de Datos Personales del Perú.' },
    ],
  },
]

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
        <span className="text-sm font-bold text-slate-800 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CentroAyudaPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <BrandLogo size="sm" />
        <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#00BCD4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </nav>

      <section className="bg-slate-900 text-white py-24 px-6 text-center">
        <motion.div {...fade} className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <HelpCircle className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">FAQ & Soporte</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Ayuda</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Encuentra respuestas a las preguntas más frecuentes sobre AxyntraX Automation.</p>
        </motion.div>
      </section>

      <section className="py-20 px-6 max-w-4xl mx-auto space-y-14">
        {FAQS.map((cat, i) => (
          <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full" style={{ background: cat.color }} />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{cat.cat}</h2>
            </div>
            <div className="space-y-3">
              {cat.items.map((item, j) => <FaqItem key={j} {...item} />)}
            </div>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#00BCD4]/5 border-t border-[#00BCD4]/10 text-center">
        <motion.div {...fade} className="max-w-2xl mx-auto space-y-6">
          <MessageSquare className="w-12 h-12 text-[#00BCD4] mx-auto" />
          <h3 className="text-2xl font-black text-slate-900">¿No encontraste tu respuesta?</h3>
          <p className="text-slate-500 text-sm">Escríbenos directamente. CECILIA responde al instante y un asesor humano te contacta si necesitas más ayuda.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/51991740590?text=Hola%2C%20tengo%20una%20consulta%20sobre%20AxyntraX" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#25D366]/30">
              WhatsApp Soporte
            </a>
            <Link to="/contacto" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
              <Zap className="w-4 h-4" /> Formulario de Contacto
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="py-12 border-t border-slate-100 bg-slate-50 text-center">
        <BrandLogo size="sm" />
        <div className="flex justify-center gap-6 mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/terminos" className="hover:text-[#00BCD4] transition-colors">Términos</Link>
          <Link to="/privacidad" className="hover:text-[#00BCD4] transition-colors">Privacidad</Link>
          <Link to="/contacto" className="hover:text-[#00BCD4] transition-colors">Contacto</Link>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-4">© 2026 AXYNTRAX AUTOMATION. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
