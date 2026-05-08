import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowLeft, Handshake, Globe, Users, Send, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function PartnersPage() {
  const [form, setForm] = useState({ nombre: '', empresa: '', correo: '', tipo: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const msg = `Hola, soy ${form.nombre} de ${form.empresa}. Correo: ${form.correo}. Tipo: ${form.tipo}. Mensaje: ${form.mensaje}`
    window.open(`https://wa.me/51991740590?text=${encodeURIComponent(msg)}`, '_blank')
    setEnviado(true)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <BrandLogo size="sm" />
        <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#00BCD4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4]/10 via-transparent to-transparent pointer-events-none" />
        <motion.div {...fade} className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Handshake className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">Alianzas Estratégicas</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Programa de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Partners</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Estamos abiertos a alianzas estratégicas con empresas de tecnología, distribuidores y consultoras que quieran crecer junto a nosotros.
          </p>
        </motion.div>
      </section>

      {/* Tipos de alianza */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div {...fade} className="text-center mb-16">
          <span className="text-xs font-black uppercase tracking-[0.4em] text-[#00BCD4]">Tipos de Alianza</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">¿Cómo podemos trabajar juntos?</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Globe,   color: '#00BCD4', tipo: 'Distribuidor',   desc: 'Comercializa las licencias KEYGE de AxyntraX en tu región o sector. Accede a precios especiales y soporte prioritario.' },
            { icon: Users,   color: '#8B5CF6', tipo: 'Consultora',      desc: 'Integra AxyntraX en tus proyectos de transformación digital. Comisiones atractivas y co-marketing incluido.' },
            { icon: Handshake,color:'#FFD700', tipo: 'Tech Partner',    desc: 'Integra tu software con la API de AxyntraX. Acceso a documentación técnica y sandbox de desarrollo.' },
          ].map(({ icon: Icon, color, tipo, desc }) => (
            <motion.div key={tipo} whileHover={{ y: -6 }} className="p-8 bg-slate-50 border border-slate-100 rounded-3xl hover:border-[#00BCD4]/30 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${color}15` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-3">{tipo}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade} className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900">Beneficios del Programa</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Comisiones de hasta 30% por cada licencia referida',
              'Material de marketing y branding co-branded',
              'Acceso anticipado a nuevos módulos y funcionalidades',
              'Soporte técnico prioritario para proyectos de clientes',
              'Capacitación gratuita en la plataforma AxyntraX',
              'Listing en nuestro directorio oficial de partners',
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-[#00BCD4] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="py-24 px-6 max-w-2xl mx-auto">
        <motion.div {...fade} className="text-center mb-12">
          <span className="text-xs font-black uppercase tracking-[0.4em] text-[#00BCD4]">Contáctanos</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Inicia la Conversación</h2>
          <p className="text-slate-500 mt-2 text-sm">Completa el formulario y nos ponemos en contacto en menos de 24 horas.</p>
        </motion.div>

        {enviado ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 bg-[#00BCD4]/5 border border-[#00BCD4]/20 rounded-3xl">
            <CheckCircle2 className="w-16 h-16 text-[#00BCD4] mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900">¡Mensaje enviado!</h3>
            <p className="text-slate-500 mt-2">Te contactaremos en menos de 24 horas. También puedes escribirnos directamente por WhatsApp.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { field: 'nombre',  label: 'Nombre completo',    type: 'text',  placeholder: 'Tu nombre' },
              { field: 'empresa', label: 'Empresa / Organización', type: 'text', placeholder: 'Nombre de tu empresa' },
              { field: 'correo',  label: 'Correo electrónico', type: 'email', placeholder: 'correo@empresa.com' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{label} *</label>
                <input type={type} required value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00BCD4] transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Tipo de alianza *</label>
              <select required value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00BCD4] transition-colors bg-white">
                <option value="">Selecciona una opción</option>
                <option value="Distribuidor">Distribuidor</option>
                <option value="Consultora">Consultora / Integradora</option>
                <option value="Tech Partner">Tech Partner / API</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Mensaje</label>
              <textarea rows={4} value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} placeholder="Cuéntanos sobre tu empresa y cómo te gustaría colaborar..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00BCD4] transition-colors resize-none" />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-[#00BCD4] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#00BCD4]/30">
              <Send className="w-4 h-4" /> Enviar Solicitud de Alianza
            </button>
          </form>
        )}
      </section>

      <footer className="py-12 border-t border-slate-100 bg-slate-50 text-center">
        <BrandLogo size="sm" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-6">© 2026 AXYNTRAX AUTOMATION. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
