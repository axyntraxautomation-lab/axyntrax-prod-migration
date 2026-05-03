import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

const Section = ({ title, children }) => (
  <motion.section {...fade} className="mb-10">
    <h2 className="text-base font-black uppercase tracking-widest text-[#00BCD4] mb-3 border-b border-slate-100 pb-2">{title}</h2>
    <div className="space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
  </motion.section>
)

export default function SunatPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <BrandLogo size="sm" />
        <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#00BCD4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </nav>

      <div className="bg-slate-900 text-white py-20 px-6 text-center">
        <motion.div {...fade} className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <FileText className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">Comprobantes Electrónicos</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            Homologación <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">SUNAT</span>
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">Proceso de certificación para emisión de comprobantes electrónicos desde la plataforma AxyntraX.</p>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10 p-6 bg-[#00BCD4]/5 border border-[#00BCD4]/20 rounded-2xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>AxyntraX Automation S.A.C.</strong> se encuentra actualmente en proceso de homologación ante la
            <strong> Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT)</strong> para la emisión
            de comprobantes de pago electrónicos conforme a las Resoluciones de Superintendencia vigentes.
          </p>
        </div>

        <Section title="Estado Actual del Proceso">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { paso: '01', label: 'Registro como PSE', estado: 'Completado', ok: true },
              { paso: '02', label: 'Desarrollo del motor de facturación', estado: 'En proceso', ok: false },
              { paso: '03', label: 'Pruebas en entorno SUNAT Beta', estado: 'Pendiente', ok: false },
              { paso: '04', label: 'Certificación y producción', estado: 'Pendiente', ok: false },
            ].map(({ paso, label, estado, ok }) => (
              <div key={paso} className={`flex items-start gap-3 p-4 rounded-2xl border ${ok ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ok ? 'text-green-500' : 'text-slate-300'}`} />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Paso {paso}</p>
                  <p className="font-bold text-slate-800 text-sm">{label}</p>
                  <p className={`text-xs font-bold mt-0.5 ${ok ? 'text-green-600' : 'text-slate-400'}`}>{estado}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="¿Qué significa esto para nuestros clientes?">
          <p>Una vez completado el proceso de homologación, los clientes de AxyntraX podrán emitir directamente desde la plataforma:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Boletas de venta electrónicas</strong> (para consumidores finales)</li>
            <li><strong>Facturas electrónicas</strong> (para empresas y personas jurídicas)</li>
            <li><strong>Notas de crédito y débito</strong> electrónicas</li>
            <li><strong>Guías de remisión</strong> electrónicas</li>
          </ul>
          <p className="mt-3">Todos los comprobantes serán enviados automáticamente a SUNAT y al cliente por correo electrónico.</p>
        </Section>

        <Section title="Marco Normativo Aplicable">
          <ul className="list-disc pl-5 space-y-1">
            <li>Resolución de Superintendencia N° 300-2014/SUNAT — Sistema de Emisión Electrónica</li>
            <li>Resolución de Superintendencia N° 117-2017/SUNAT — Factura Electrónica</li>
            <li>Resolución de Superintendencia N° 193-2020/SUNAT — Boleta de Venta Electrónica</li>
            <li>Decreto Legislativo N° 1314 — Factura Negociable</li>
          </ul>
        </Section>

        <Section title="Fecha Estimada de Disponibilidad">
          <div className="p-5 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl">
            <p className="font-black text-slate-800">Tercer trimestre 2026</p>
            <p className="text-slate-500 mt-1">Los clientes actuales recibirán notificación por correo y WhatsApp cuando la funcionalidad esté disponible en su módulo.</p>
          </div>
        </Section>

        <Section title="Consultas">
          <p>Para consultas sobre facturación electrónica y el proceso de homologación, contáctenos en:</p>
          <div className="mt-3 space-y-2">
            <p>📧 <a href="mailto:axyntraxautomation@gmail.com" className="text-[#00BCD4] underline">axyntraxautomation@gmail.com</a></p>
            <p>📱 <a href="https://wa.me/51991740590" target="_blank" rel="noopener noreferrer" className="text-[#00BCD4] underline">+51 991 740 590</a></p>
            <p>🌐 <a href="https://www.axyntrax-automation.com" className="text-[#00BCD4] underline">www.axyntrax-automation.com</a></p>
          </div>
        </Section>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest">© 2026 AxyntraX Automation S.A.C. · Lima, Perú</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/terminos" className="text-xs text-[#00BCD4] hover:underline font-bold uppercase tracking-wider">Términos</Link>
            <Link to="/privacidad" className="text-xs text-[#00BCD4] hover:underline font-bold uppercase tracking-wider">Privacidad</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
