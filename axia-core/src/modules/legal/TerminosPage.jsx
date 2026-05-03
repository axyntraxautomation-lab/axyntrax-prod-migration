/**
 * TerminosPage.jsx — Términos y Condiciones de Uso
 * AxyntraX Automation · Lima, Perú · Ley aplicable: Perú
 */
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Scale, ArrowLeft, Shield, AlertTriangle, CreditCard, Ban, Bot, Smartphone } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const FECHA_ACTUALIZACION = '23 de abril de 2026'
const EMAIL_LEGAL = 'legal@axyntrax-automation.com'
const EMPRESA = 'AxyntraX Automation S.A.C.'

const Section = ({ icon: Icon, color = '#00BCD4', title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="mb-12 scroll-mt-24"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
    </div>
    <div className="pl-[52px] space-y-4 text-slate-600 text-sm leading-relaxed">
      {children}
    </div>
  </motion.section>
)

const Clause = ({ num, title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
      Artículo {num} — {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
)

const Disclaimer = ({ color = '#EF4444', icon: Icon = AlertTriangle, label, children }) => (
  <div className="flex gap-3 p-4 rounded-2xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
    <div>
      <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  </div>
)

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit">

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <BrandLogo size="sm" />
        <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#00BCD4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </nav>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Scale className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">Documento Legal Oficial</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Términos y<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Condiciones de Uso</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Última actualización: <strong className="text-white">{FECHA_ACTUALIZACION}</strong>
            &nbsp;·&nbsp; Aplicable a todos los servicios de {EMPRESA}
          </p>
        </motion.div>
      </div>

      {/* Índice rápido */}
      <div className="bg-slate-50 border-b border-slate-100 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
          {['Naturaleza del Servicio','Descargos Médicos','Inteligencia Artificial','WhatsApp & Meta','Pagos','Cancelación','Contacto'].map((t, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 rounded-full px-3 py-1 bg-white">
              {i + 1}. {t}
            </span>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Preámbulo */}
        <div className="mb-12 p-6 bg-[#00BCD4]/5 border border-[#00BCD4]/20 rounded-2xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            El presente documento regula el acceso y uso de los servicios tecnológicos ofrecidos por <strong>{EMPRESA}</strong>
            , empresa constituida bajo las leyes de la República del Perú, con domicilio en Lima, Perú.
            Al activar su licencia (KEYGE) o acceder a cualquier módulo de la plataforma AxyntraX, usted —en calidad de
            representante legal o usuario autorizado de la empresa cliente ("EL CLIENTE")— acepta íntegramente
            los presentes Términos y Condiciones, sin reserva alguna.
          </p>
        </div>

        {/* 1. NATURALEZA DEL SERVICIO */}
        <Section icon={Shield} title="1. Naturaleza del Servicio (Licencia SaaS)">
          <Clause num="1.1" title="Modelo de Licencia">
            <p>
              AxyntraX Automation provee sus productos bajo el modelo de <strong>Software as a Service (SaaS)</strong>,
              mediante el otorgamiento de una <strong>licencia de uso temporal, personal e intransferible</strong>
              , identificada como "KEYGE". EL CLIENTE adquiere el derecho de uso de la plataforma durante
              el período contratado, pero no adquiere en ningún caso la propiedad, el código fuente, los
              algoritmos subyacentes ni ningún activo intelectual de AxyntraX Automation.
            </p>
          </Clause>
          <Clause num="1.2" title="Alcance de la Licencia">
            <p>
              La licencia KEYGE habilita el acceso a los módulos específicamente contratados por EL CLIENTE
              (MediBot, VetBot, DentBot, Logística, Finanzas, Legal u otros según plan). El acceso a módulos
              no adquiridos será bloqueado automáticamente por el sistema.
            </p>
          </Clause>
          <Clause num="1.3" title="Propiedad Intelectual">
            <p>
              Toda la tecnología, diseño, marca, denominación "AXYNTRAX", "AXIA", "CECILIA", "KEYGE" y
              demás elementos del sistema son propiedad exclusiva de {EMPRESA}
              , protegidos por las leyes peruanas de propiedad intelectual y derechos de autor.
              Queda estrictamente prohibida su reproducción, ingeniería inversa o distribución sin autorización escrita.
            </p>
          </Clause>
        </Section>

        {/* 2. DESCARGOS MÉDICOS */}
        <Section icon={AlertTriangle} color="#EF4444" title="2. Descargos de Responsabilidad — Sector Médico y de Salud">
          <Clause num="2.1" title="Herramienta Administrativa, No Clínica">
            <Disclaimer icon={AlertTriangle} color="#EF4444" label="AVISO LEGAL CRÍTICO — USO MÉDICO">
              AxyntraX Automation es exclusivamente una <strong>herramienta de gestión administrativa</strong>.
              La plataforma NO emite diagnósticos, NO prescribe tratamientos y NO reemplaza el criterio
              clínico del profesional de salud. El médico, dentista, veterinario o profesional de salud
              es el <strong>único y exclusivo responsable</strong> de todos los diagnósticos, tratamientos
              y decisiones clínicas adoptadas. AxyntraX Automation declina toda responsabilidad por
              perjuicios derivados de interpretaciones médicas basadas en datos del sistema.
            </Disclaimer>
          </Clause>
          <Clause num="2.2" title="Historial Clínico Digital">
            <p>
              El módulo de historia clínica es un repositorio de información ingresada por EL CLIENTE o
              sus usuarios. AxyntraX Automation no valida la exactitud médica de dicha información.
              EL CLIENTE es responsable de la veracidad, integridad y custodia de los registros clínicos.
            </p>
          </Clause>
        </Section>

        {/* 3. INTELIGENCIA ARTIFICIAL */}
        <Section icon={Bot} color="#8B5CF6" title="3. Descargos — Inteligencia Artificial (AXIA / CECILIA)">
          <Clause num="3.1" title="Naturaleza Probabilística de la IA">
            <Disclaimer icon={Bot} color="#8B5CF6" label="LIMITACIÓN DE LA IA — LEER OBLIGATORIAMENTE">
              Los agentes de inteligencia artificial AXIA y CECILIA son sistemas probabilísticos que pueden
              generar respuestas inexactas, incompletas o inconsistentes con la realidad, fenómeno conocido
              técnicamente como "alucinación". <strong>Toda decisión ejecutiva, financiera, legal o clínica
              basada en recomendaciones de AXIA o CECILIA es responsabilidad exclusiva del gerente
              o directivo humano que la adopte.</strong> AxyntraX Automation no garantiza la exactitud
              de las respuestas generadas por IA y no será responsable por pérdidas derivadas de su uso acrítico.
            </Disclaimer>
          </Clause>
          <Clause num="3.2" title="Uso Correcto de la IA">
            <p>
              EL CLIENTE se compromete a utilizar los agentes de IA como herramientas de apoyo y análisis,
              siempre bajo la supervisión de personal humano calificado. La automatización de decisiones
              de alto impacto (financieras, legales, clínicas) debe estar sujeta a validación humana previa.
            </p>
          </Clause>
        </Section>

        {/* 4. WHATSAPP & META */}
        <Section icon={Smartphone} color="#25D366" title="4. Descargos — Plataformas de Terceros (Meta / WhatsApp Business API)">
          <Clause num="4.1" title="Servicio de Terceros">
            <p>
              El Bot CECILIA opera sobre la <strong>API de WhatsApp Business de Meta Platforms, Inc.</strong>,
              empresa independiente y ajena a AxyntraX Automation. En consecuencia, AxyntraX Automation
              no controla, garantiza ni puede responsabilizarse por:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Interrupciones, bloqueos o cambios en la política de uso de Meta/WhatsApp.</li>
              <li>Suspensión o inhabilitación del número de WhatsApp Business de EL CLIENTE por incumplimiento de las <a href="https://www.whatsapp.com/legal/business-policy" className="text-[#00BCD4] underline" target="_blank" rel="noopener noreferrer">Políticas de Meta para Empresas</a>.</li>
              <li>Cambios en tarifas, cuotas de mensajería o funcionalidades de la API de Meta.</li>
            </ul>
          </Clause>
          <Clause num="4.2" title="Responsabilidad del Cliente en el Uso del Bot">
            <Disclaimer icon={AlertTriangle} color="#F59E0B" label="ADVERTENCIA — POLÍTICA ANTI-SPAM">
              EL CLIENTE se compromete expresamente a <strong>no utilizar el Bot CECILIA para enviar mensajes
              masivos no solicitados (SPAM)</strong>, contenido publicitario engañoso, comunicaciones ilegales
              ni cualquier otro uso que infrinja las políticas de Meta o la legislación peruana vigente.
              El incumplimiento de esta cláusula exonera a AxyntraX Automation de toda responsabilidad
              ante bloqueos de la cuenta de WhatsApp Business de EL CLIENTE.
            </Disclaimer>
          </Clause>
        </Section>

        {/* 5. PAGOS Y REEMBOLSOS */}
        <Section icon={CreditCard} color="#0EA5E9" title="5. Pagos, Suscripción y Política de Reembolsos">
          <Clause num="5.1" title="Modelo de Pago Prepago">
            <p>
              Los servicios de AxyntraX Automation operan bajo un modelo de <strong>suscripción prepago mensual
              o anual</strong>. El pago habilita la licencia KEYGE por el período contratado.
            </p>
          </Clause>
          <Clause num="5.2" title="No Reembolso por Período No Utilizado">
            <Disclaimer icon={CreditCard} color="#0EA5E9" label="POLÍTICA DE REEMBOLSOS">
              <strong>AxyntraX Automation no realiza reembolsos parciales ni totales</strong> por períodos
              de licencia contratados y no utilizados, cancelaciones anticipadas ni por periodos de
              inactividad voluntaria de EL CLIENTE. Al realizar el pago, EL CLIENTE acepta
              íntegramente esta política.
            </Disclaimer>
          </Clause>
          <Clause num="5.3" title="Límite de Usuarios y Costo Adicional">
            <p>
              El plan base incluye hasta <strong>cinco (5) usuarios activos</strong> simultáneos en la plataforma.
              La habilitación de usuarios adicionales generará un cargo extra según la tarifa vigente en
              el momento de la solicitud, la cual será comunicada por escrito al correo registrado de EL CLIENTE.
            </p>
          </Clause>
          <Clause num="5.4" title="Impuestos">
            <p>
              Los precios publicados podrán estar sujetos al Impuesto General a las Ventas (IGV) vigente
              en Perú (18%) y a otros tributos aplicables según la legislación peruana. AxyntraX Automation
              emitirá los comprobantes de pago correspondientes según ley.
            </p>
          </Clause>
        </Section>

        {/* 6. CANCELACIÓN */}
        <Section icon={Ban} color="#EF4444" title="6. Cancelación y Terminación de Licencia">
          <Clause num="6.1" title="Cancelación por Uso Ilícito">
            <Disclaimer icon={Ban} color="#EF4444" label="TERMINACIÓN POR CAUSA JUSTIFICADA">
              AxyntraX Automation se reserva el derecho de <strong>cancelar, suspender o revocar
              la licencia KEYGE de forma inmediata y sin derecho a reembolso</strong> cuando EL CLIENTE:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Utilice el sistema para actividades ilícitas conforme a la legislación peruana.</li>
                <li>Comparta, transfiera o sublicencie la KEYGE a terceros no autorizados.</li>
                <li>Realice ingeniería inversa, scraping masivo o ataques a la infraestructura del sistema.</li>
                <li>Incumpla las políticas de uso de Meta/WhatsApp en el contexto del Bot CECILIA.</li>
                <li>Proporcione datos falsos en el proceso de contratación o facturación.</li>
              </ul>
            </Disclaimer>
          </Clause>
          <Clause num="6.2" title="Cancelación Voluntaria por el Cliente">
            <p>
              EL CLIENTE podrá cancelar su suscripción notificando por escrito con al menos
              <strong> 15 días de anticipación</strong> al correo <a href={`mailto:${EMAIL_LEGAL}`} className="text-[#00BCD4] underline">{EMAIL_LEGAL}</a>.
              La licencia permanecerá activa hasta el término del período prepagado sin derecho a
              reembolso proporcional.
            </p>
          </Clause>
          <Clause num="6.3" title="Efectos de la Terminación">
            <p>
              Al término o cancelación de la licencia, EL CLIENTE dispondrá de un plazo de
              <strong> 30 días calendario</strong> para exportar sus datos desde la plataforma.
              Transcurrido dicho plazo, AxyntraX Automation podrá eliminar permanentemente
              los datos asociados a la cuenta, sin responsabilidad ulterior.
            </p>
          </Clause>
        </Section>

        {/* 7. CONTACTO */}
        <Section icon={Scale} title="7. Ley Aplicable, Jurisdicción y Contacto Legal">
          <Clause num="7.1" title="Ley Aplicable">
            <p>
              Los presentes Términos y Condiciones se rigen por las leyes de la República del Perú.
              Cualquier controversia derivada de su interpretación o aplicación será sometida a la
              jurisdicción de los juzgados y tribunales competentes de la ciudad de Lima, renunciando
              las partes a cualquier otro fuero que pudiera corresponderles.
            </p>
          </Clause>
          <Clause num="7.2" title="Contacto Legal">
            <p>
              Para consultas, reclamos o notificaciones legales, diríjase a:
              <br /><strong>AxyntraX Automation S.A.C. — Área Legal</strong>
              <br />Correo: <a href={`mailto:${EMAIL_LEGAL}`} className="text-[#00BCD4] underline">{EMAIL_LEGAL}</a>
              <br />WhatsApp: <a href="https://wa.me/51991740590" className="text-[#00BCD4] underline" target="_blank" rel="noopener noreferrer">+51 991 740 590</a>
              <br />Lima, Perú.
            </p>
          </Clause>
        </Section>

        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            © 2026 {EMPRESA} · Todos los derechos reservados · Lima, Perú
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/privacidad" className="text-xs text-[#00BCD4] hover:underline font-bold uppercase tracking-wider">
              Política de Privacidad
            </Link>
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 uppercase tracking-wider">
              Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
