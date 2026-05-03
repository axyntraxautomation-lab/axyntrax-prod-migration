import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowLeft, Clock, User, ArrowRight } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const ARTICULOS = [
  {
    id: 1, categoria: 'Automatización', color: '#00BCD4', tag: 'Salud · IA',
    titulo: 'Cómo la IA Está Transformando las Clínicas Médicas del Perú',
    resumen: 'Las clínicas que adoptan IA para gestión de citas e historias clínicas reportan reducciones de hasta 40% en tiempos administrativos y un aumento del 25% en satisfacción del paciente.',
    autor: 'Equipo AxyntraX', fecha: '20 de abril de 2026', lectura: '5 min',
  },
  {
    id: 2, categoria: 'SaaS B2B', color: '#8B5CF6', tag: 'Negocio · SaaS',
    titulo: 'Software SaaS para MYPEs Peruanas: El Mercado que Nadie Estaba Atendiendo',
    resumen: 'Perú tiene más de 2.7 millones de MYPEs. Solo el 12% usa software de gestión. AxyntraX nació para llenar ese vacío con tecnología de clase mundial a precios accesibles.',
    autor: 'Miguel Montero – CEO AxyntraX', fecha: '15 de abril de 2026', lectura: '7 min',
  },
  {
    id: 3, categoria: 'Inteligencia Artificial', color: '#25D366', tag: 'WhatsApp · IA',
    titulo: 'WhatsApp Business API + IA: La Revolución en Atención al Cliente en Perú',
    resumen: 'CECILIA procesa más de 500 consultas por mes sin intervención humana. Descubre cómo las empresas peruanas usan WhatsApp como su canal principal de ventas automatizado.',
    autor: 'Equipo AxyntraX', fecha: '10 de abril de 2026', lectura: '6 min',
  },
]

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function BlogPage() {
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
          <span className="text-xs font-black uppercase tracking-[0.4em] text-[#00BCD4]">Insights & Tendencias</span>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mt-4 mb-4">
            Blog <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">AxyntraX</span>
          </h1>
          <p className="text-slate-400 text-sm">Automatización · Inteligencia Artificial · SaaS · Perú</p>
        </motion.div>
      </section>
      <section className="py-20 px-6 max-w-5xl mx-auto space-y-10">
        {ARTICULOS.map((art, i) => (
          <motion.article key={art.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
            <div className="h-1.5 w-full" style={{ background: art.color }} />
            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: `${art.color}15`, color: art.color }}>{art.categoria}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{art.tag}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4">{art.titulo}</h2>
              <p className="text-slate-500 leading-relaxed mb-6">{art.resumen}</p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{art.autor}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{art.fecha} · {art.lectura}</span>
                </div>
                <a href={`https://wa.me/51991740590?text=Quiero%20saber%20m%C3%A1s%20sobre%20el%20artículo%20${encodeURIComponent(art.titulo)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all hover:scale-105" style={{ color: art.color, borderColor: `${art.color}30` }}>
                  Leer más <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </section>
      <footer className="py-12 border-t border-slate-100 bg-slate-50 text-center">
        <BrandLogo size="sm" />
        <div className="flex justify-center gap-6 mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/nosotros" className="hover:text-[#00BCD4] transition-colors">Nosotros</Link>
          <Link to="/partners" className="hover:text-[#00BCD4] transition-colors">Partners</Link>
          <Link to="/contacto" className="hover:text-[#00BCD4] transition-colors">Contacto</Link>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-4">© 2026 AXYNTRAX AUTOMATION. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
