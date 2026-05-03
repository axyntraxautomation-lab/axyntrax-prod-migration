import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', empresa: '', correo: '', telefono: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const msg = `Hola AxyntraX! Nombre: ${form.nombre} | Empresa: ${form.empresa} | Correo: ${form.correo} | Tel: ${form.telefono} | Mensaje: ${form.mensaje}`
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

      <section className="bg-slate-900 text-white py-24 px-6 text-center">
        <motion.div {...fade} className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <MessageSquare className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">Estamos Aquí</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Contáctanos</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Respondemos en menos de 24 horas. También puedes escribirnos directamente por WhatsApp.</p>
        </motion.div>
      </section>

      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <motion.div {...fade} className="space-y-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-6">Información de Contacto</h2>
              <div className="space-y-5">
                {[
                  { icon: MapPin, label: 'Dirección', value: 'Lima, Perú' },
                  { icon: Phone,  label: 'WhatsApp',  value: '+51 991 740 590' },
                  { icon: Mail,   label: 'Email',      value: 'axyntraxautomation@gmail.com' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-10 h-10 bg-[#00BCD4]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#00BCD4]" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-[#25D366]/5 border border-[#25D366]/20 rounded-2xl">
              <h3 className="font-black text-slate-900 mb-2">Respuesta inmediata por WhatsApp</h3>
              <p className="text-slate-500 text-sm mb-4">CECILIA, nuestra IA, responde al instante. Un asesor humano te contacta en horario de oficina.</p>
              <a href="https://wa.me/51991740590?text=Hola%2C%20quiero%20información%20sobre%20AxyntraX%20Automation"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#25D366]/30">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Escribir por WhatsApp
              </a>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div {...fade} transition={{ delay: 0.2 }}>
            {enviado ? (
              <div className="text-center p-12 bg-[#00BCD4]/5 border border-[#00BCD4]/20 rounded-3xl">
                <CheckCircle2 className="w-16 h-16 text-[#00BCD4] mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900">¡Mensaje enviado!</h3>
                <p className="text-slate-500 mt-2 text-sm">Nos ponemos en contacto en menos de 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-black text-slate-900 mb-6">Envíanos un mensaje</h2>
                {[
                  { field: 'nombre',   label: 'Nombre completo *',     type: 'text',  placeholder: 'Tu nombre' },
                  { field: 'empresa',  label: 'Empresa / Clínica',      type: 'text',  placeholder: 'Nombre de tu organización' },
                  { field: 'correo',   label: 'Correo electrónico *',   type: 'email', placeholder: 'correo@empresa.com' },
                  { field: 'telefono', label: 'Teléfono / WhatsApp',    type: 'tel',   placeholder: '+51 999 000 000' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">{label}</label>
                    <input type={type} required={label.includes('*')} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00BCD4] transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Mensaje *</label>
                  <textarea rows={4} required value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} placeholder="¿En qué podemos ayudarte?"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00BCD4] transition-colors resize-none" />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-[#00BCD4] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#00BCD4]/30">
                  <Send className="w-4 h-4" /> Enviar Mensaje
                </button>
                <p className="text-xs text-slate-400 text-center">Al enviar, aceptas nuestra <Link to="/privacidad" className="text-[#00BCD4] underline">Política de Privacidad</Link></p>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 bg-slate-50 text-center">
        <BrandLogo size="sm" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-6">© 2026 AXYNTRAX AUTOMATION. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
