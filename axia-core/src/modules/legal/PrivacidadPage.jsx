/**
 * PrivacidadPage.jsx — Política de Privacidad y Tratamiento de Datos Personales
 * AxyntraX Automation · Lima, Perú
 * Basado en Ley N° 29733 y su Reglamento (D.S. N° 003-2013-JUS)
 */
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, AlertTriangle, FileText, Mail } from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'

const FECHA_ACTUALIZACION = '23 de abril de 2026'
const EMAIL_PRIVACIDAD    = 'privacidad@axyntrax-automation.com'
const EMPRESA             = 'AxyntraX Automation S.A.C.'

const Section = ({ icon: Icon, color = '#00BCD4', title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="mb-12"
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
      {num} — {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
)

const InfoBox = ({ color = '#00BCD4', icon: Icon = Shield, label, children }) => (
  <div className="flex gap-3 p-4 rounded-2xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
    <div>
      <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color }}>{label}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  </div>
)

const RoleCard = ({ title, badge, badgeColor, description, items }) => (
  <div className="flex-1 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{title}</h4>
      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: `${badgeColor}15`, color: badgeColor }}>
        {badge}
      </span>
    </div>
    <p className="text-xs text-slate-500 mb-4 leading-relaxed">{description}</p>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: badgeColor }} />
          {item}
        </li>
      ))}
    </ul>
  </div>
)

export default function PrivacidadPage() {
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
            <Lock className="w-4 h-4 text-[#00BCD4]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00BCD4]">Ley N° 29733 — Perú</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Política de<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Privacidad</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Última actualización: <strong className="text-white">{FECHA_ACTUALIZACION}</strong>
            &nbsp;·&nbsp; Basado en la Ley N° 29733 y su Reglamento D.S. N° 003-2013-JUS
          </p>
        </motion.div>
      </div>

      {/* Base legal badge */}
      <div className="bg-[#00BCD4]/5 border-b border-[#00BCD4]/15 py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-[10px] font-black uppercase tracking-widest text-slate-500">
          {[
            'Ley N° 29733 — Protección de Datos Personales',
            'D.S. N° 003-2013-JUS — Reglamento',
            'GDPR — Referencia Internacional',
          ].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#00BCD4]" />{t}
            </span>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Preámbulo */}
        <div className="mb-12 p-6 bg-[#00BCD4]/5 border border-[#00BCD4]/20 rounded-2xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>{EMPRESA}</strong> está comprometida con la protección de los datos personales
            de sus clientes y usuarios finales. La presente Política describe cómo se recaban, utilizan,
            almacenan y protegen los datos personales en el marco de la prestación de los servicios de
            la plataforma AxyntraX, en estricto cumplimiento de la <strong>Ley N° 29733, Ley de Protección
            de Datos Personales del Perú</strong>, y su Reglamento aprobado por <strong>D.S. N° 003-2013-JUS</strong>.
          </p>
        </div>

        {/* 1. DEFINICIÓN DE ROLES */}
        <Section icon={UserCheck} title="1. Definición de Roles en el Tratamiento de Datos">
          <Clause num="1.1" title="Marco Legal de Responsabilidades">
            <p>En el contexto del servicio ofrecido por AxyntraX Automation, se establecen con claridad los siguientes roles:</p>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <RoleCard
                title="Titular / Responsable del Banco de Datos"
                badge="EL CLIENTE"
                badgeColor="#EF4444"
                description="La Clínica, MYPE u organización que contrata los servicios de AxyntraX Automation y administra los datos de sus propios pacientes, clientes o empleados."
                items={[
                  'Define los fines del tratamiento de datos.',
                  'Es responsable ante la ANPD por los datos de sus titulares.',
                  'Debe obtener el consentimiento de sus pacientes/clientes.',
                  'Responde ante reclamos de los titulares de datos.',
                ]}
              />
              <RoleCard
                title="Encargado del Tratamiento"
                badge="AXYNTRAX"
                badgeColor="#00BCD4"
                description="AxyntraX Automation actúa únicamente como proveedor de infraestructura tecnológica y procesador de datos bajo las instrucciones de EL CLIENTE."
                items={[
                  'Procesa datos solo según instrucciones de EL CLIENTE.',
                  'No determina los fines del tratamiento.',
                  'Implementa medidas técnicas de seguridad.',
                  'No comercializa ni comparte datos con terceros sin autorización.',
                ]}
              />
            </div>
          </Clause>
          <Clause num="1.2" title="Implicaciones Prácticas">
            <InfoBox icon={AlertTriangle} color="#F59E0B" label="RESPONSABILIDAD DEL CLIENTE">
              EL CLIENTE, en su calidad de Responsable del Banco de Datos ante la Autoridad Nacional
              de Protección de Datos Personales (ANPD), deberá registrar su banco de datos según
              lo exigido por la Ley N° 29733 y obtener el consentimiento informado de los titulares
              de los datos que ingrese al sistema AxyntraX.
            </InfoBox>
          </Clause>
        </Section>

        {/* 2. DATOS QUE RECOPILAMOS */}
        <Section icon={Database} color="#8B5CF6" title="2. Datos Personales Recopilados">
          <Clause num="2.1" title="Datos de EL CLIENTE (Usuario de la Plataforma)">
            <p>Para la prestación del servicio, AxyntraX recopila datos del representante o usuarios de EL CLIENTE:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre, apellidos, correo electrónico, teléfono de contacto.</li>
              <li>Datos de la empresa (RUC, razón social, dirección).</li>
              <li>Credenciales de acceso (email + hash de contraseña encriptado).</li>
              <li>Datos de pago procesados por pasarelas seguras (no almacenamos números de tarjeta).</li>
              <li>Registros de acceso y actividad en la plataforma (logs de auditoría).</li>
            </ul>
          </Clause>
          <Clause num="2.2" title="Datos de los Usuarios Finales de EL CLIENTE">
            <p>
              A través de los módulos contratados (historias clínicas, CRM, logística, etc.),
              EL CLIENTE puede ingresar datos de <strong>sus propios pacientes, clientes o colaboradores</strong>.
              AxyntraX actúa como Encargado del Tratamiento respecto a estos datos y los procesa
              únicamente para proveer las funcionalidades contratadas.
            </p>
            <InfoBox icon={Shield} color="#00BCD4" label="GARANTÍA DE CONFIDENCIALIDAD">
              AxyntraX Automation <strong>NO vende, NO arrienda, NO comparte ni NO transfiere</strong> historiales
              médicos, datos financieros, información de pacientes ni ningún dato personal de los
              usuarios finales de EL CLIENTE con terceros, socios comerciales o plataformas publicitarias.
            </InfoBox>
          </Clause>
          <Clause num="2.3" title="Datos de Interacción con el Bot CECILIA">
            <p>
              Las conversaciones de WhatsApp gestionadas por el Bot CECILIA se almacenan en la plataforma
              Firebase de Google para permitir el seguimiento conversacional. Estos datos se emplean
              exclusivamente para la prestación del servicio de atención al cliente automatizado y no
              se utilizan con fines publicitarios ni se ceden a terceros.
            </p>
          </Clause>
        </Section>

        {/* 3. FINALIDADES */}
        <Section icon={Eye} color="#0EA5E9" title="3. Finalidades del Tratamiento de Datos">
          <Clause num="3.1" title="Finalidades Legítimas">
            <p>AxyntraX Automation trata los datos personales para las siguientes finalidades:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Prestación del Servicio', desc: 'Operar y mantener los módulos contratados.' },
                { label: 'Soporte Técnico', desc: 'Atender incidencias y resolver problemas técnicos.' },
                { label: 'Facturación', desc: 'Emitir comprobantes de pago y gestionar cobros.' },
                { label: 'Seguridad', desc: 'Detectar y prevenir accesos no autorizados o fraudes.' },
                { label: 'Mejora del Servicio', desc: 'Analizar métricas agregadas y anónimas para mejorar la plataforma.' },
                { label: 'Comunicaciones Legales', desc: 'Notificar cambios en políticas o términos de servicio.' },
              ].map(({ label, desc }, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-[#00BCD4] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Clause>
          <Clause num="3.2" title="Lo que NO Hacemos con Sus Datos">
            <InfoBox icon={Shield} color="#10B981" label="COMPROMISOS DE NO USO">
              AxyntraX Automation se compromete expresamente a:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>NO vender datos personales a terceros bajo ninguna circunstancia.</li>
                <li>NO compartir información con plataformas publicitarias (Google Ads, Meta Ads, etc.).</li>
                <li>NO usar historiales médicos o datos financieros para entrenar modelos de IA propios sin consentimiento explícito.</li>
                <li>NO ceder datos a entidades gubernamentales salvo mandato judicial firme.</li>
              </ul>
            </InfoBox>
          </Clause>
        </Section>

        {/* 4. SEGURIDAD */}
        <Section icon={Lock} color="#10B981" title="4. Medidas de Seguridad Técnica y Organizativa">
          <Clause num="4.1" title="Infraestructura de Seguridad">
            <p>AxyntraX Automation implementa las siguientes medidas para proteger los datos personales:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: Lock,     color: '#10B981', label: 'Encriptación TLS/HTTPS',     desc: 'Toda comunicación entre el cliente y los servidores usa cifrado SSL/TLS.' },
                { icon: Database, color: '#0EA5E9', label: 'Contraseñas con Hash',        desc: 'Las contraseñas se almacenan usando hash SHA-256 con sal criptográfica.' },
                { icon: Shield,   color: '#8B5CF6', label: 'Servidores Cloud Seguros',    desc: 'Infraestructura en Google Cloud / Firebase con certificaciones de seguridad.' },
                { icon: Eye,      color: '#F59E0B', label: 'Auditoría Inmutable',          desc: 'Cada acción crítica genera un registro criptográfico encadenado (Sentinel).' },
                { icon: UserCheck,color: '#00BCD4', label: 'Control de Acceso por Roles', desc: 'Sistema de roles (Master, Admin, Operador) que limita el acceso a datos.' },
                { icon: FileText, color: '#EF4444', label: 'Copias de Seguridad',          desc: 'Backups periódicos de la base de datos en entornos seguros y aislados.' },
              ].map(({ icon: Icon, color, label, desc }, i) => (
                <div key={i} className="flex gap-3 p-4 border border-slate-100 rounded-2xl bg-white">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Clause>
          <Clause num="4.2" title="Notificación de Brechas de Seguridad">
            <p>
              En caso de detectarse una brecha de seguridad que afecte datos personales, AxyntraX Automation
              notificará a EL CLIENTE afectado en un plazo máximo de <strong>72 horas</strong> desde su
              conocimiento, conforme a las mejores prácticas internacionales, incluyendo la naturaleza
              del incidente, datos potencialmente comprometidos y medidas adoptadas.
            </p>
          </Clause>
        </Section>

        {/* 5. DERECHOS ARCO */}
        <Section icon={FileText} color="#8B5CF6" title="5. Derechos ARCO del Titular de Datos">
          <Clause num="5.1" title="Derechos Reconocidos por la Ley N° 29733">
            <p>Conforme a la legislación peruana, los titulares de datos personales tienen derecho a:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {[
                { letra: 'A', nombre: 'Acceso', desc: 'Conocer qué datos tuyos tratamos y con qué fines.' },
                { letra: 'R', nombre: 'Rectificación', desc: 'Corregir datos inexactos o incompletos.' },
                { letra: 'C', nombre: 'Cancelación', desc: 'Solicitar la eliminación de tus datos cuando ya no sean necesarios.' },
                { letra: 'O', nombre: 'Oposición', desc: 'Oponerte al tratamiento de tus datos en determinadas circunstancias.' },
              ].map(({ letra, nombre, desc }) => (
                <div key={letra} className="p-4 bg-slate-50 rounded-2xl text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-black text-[#8B5CF6]">{letra}</span>
                  </div>
                  <p className="text-xs font-black uppercase text-slate-800 mb-1">{nombre}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Clause>
          <Clause num="5.2" title="Ejercicio de Derechos">
            <p>
              Para ejercer cualquiera de estos derechos, EL CLIENTE o el titular de datos podrá enviar
              una solicitud escrita al correo{' '}
              <a href={`mailto:${EMAIL_PRIVACIDAD}`} className="text-[#00BCD4] underline">{EMAIL_PRIVACIDAD}</a>
              {' '}con copia de su documento de identidad, identificando claramente el derecho que desea ejercer.
              AxyntraX Automation responderá en un plazo máximo de <strong>20 días hábiles</strong>.
            </p>
          </Clause>
        </Section>

        {/* 6. COOKIES Y TERCEROS */}
        <Section icon={Eye} color="#F59E0B" title="6. Cookies, Servicios de Terceros y Transferencias">
          <Clause num="6.1" title="Cookies">
            <p>
              La plataforma AxyntraX utiliza cookies de sesión estrictamente necesarias para el
              funcionamiento del sistema (autenticación, preferencias de usuario). No se emplean
              cookies de rastreo publicitario ni de perfilado comercial.
            </p>
          </Clause>
          <Clause num="6.2" title="Proveedores Tecnológicos (Sub-Encargados)">
            <p>Para proveer el servicio, AxyntraX Automation utiliza los siguientes servicios de terceros que actúan como sub-encargados del tratamiento:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs border border-slate-100 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-black uppercase tracking-wide text-slate-600">Proveedor</th>
                    <th className="text-left p-3 font-black uppercase tracking-wide text-slate-600">Finalidad</th>
                    <th className="text-left p-3 font-black uppercase tracking-wide text-slate-600">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { p: 'Google Firebase / Cloud', f: 'Base de datos, almacenamiento y mensajería en tiempo real', u: 'EE.UU. / UE' },
                    { p: 'Meta (WhatsApp Business API)', f: 'Mensajería automatizada con el Bot CECILIA', u: 'EE.UU.' },
                    { p: 'Railway / Render', f: 'Despliegue y hosting del servidor backend', u: 'EE.UU.' },
                    { p: 'Netlify', f: 'Despliegue del panel web frontend', u: 'EE.UU.' },
                    { p: 'Google Gemini / OpenAI', f: 'Procesamiento de lenguaje natural para IA (AXIA)', u: 'EE.UU.' },
                  ].map(({ p, f, u }, i) => (
                    <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{p}</td>
                      <td className="p-3 text-slate-600">{f}</td>
                      <td className="p-3 text-slate-500">{u}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Clause>
          <Clause num="6.3" title="Transferencias Internacionales">
            <p>
              Dado que algunos de nuestros proveedores tecnológicos se encuentran fuera del Perú,
              los datos podrán ser transferidos internacionalmente. Estas transferencias se realizan
              con proveedores que cuentan con estándares de seguridad equivalentes o superiores a los
              exigidos por la legislación peruana (ISO 27001, SOC 2, etc.).
            </p>
          </Clause>
        </Section>

        {/* 7. RETENCIÓN */}
        <Section icon={Database} color="#EF4444" title="7. Retención y Eliminación de Datos">
          <Clause num="7.1" title="Plazos de Retención">
            <ul className="space-y-2">
              {[
                { tipo: 'Datos de cuenta activa', plazo: 'Durante la vigencia del contrato + 30 días post-cancelación.' },
                { tipo: 'Registros de auditoría (logs)', plazo: '5 años, por exigencia de buenas prácticas contables y legales.' },
                { tipo: 'Conversaciones del Bot CECILIA', plazo: '12 meses desde la última interacción.' },
                { tipo: 'Datos de facturación', plazo: '7 años, según Ley del Código Tributario peruano.' },
              ].map(({ tipo, plazo }, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-800">{tipo}</p>
                    <p className="text-xs text-slate-500">{plazo}</p>
                  </div>
                </div>
              ))}
            </ul>
          </Clause>
        </Section>

        {/* 8. CONTACTO */}
        <Section icon={Mail} title="8. Contacto — Área de Privacidad y Datos Personales">
          <Clause num="8.1" title="Responsable de Privacidad">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-sm"><strong>{EMPRESA}</strong></p>
              <p className="text-sm">Lima, República del Perú</p>
              <p className="text-sm">
                Correo de privacidad:{' '}
                <a href={`mailto:${EMAIL_PRIVACIDAD}`} className="text-[#00BCD4] underline">{EMAIL_PRIVACIDAD}</a>
              </p>
              <p className="text-sm">
                WhatsApp:{' '}
                <a href="https://wa.me/51991740590" className="text-[#00BCD4] underline" target="_blank" rel="noopener noreferrer">
                  +51 991 740 590
                </a>
              </p>
              <p className="text-xs text-slate-400 mt-3">
                Para consultas relacionadas con la ANPD (Autoridad Nacional de Protección de Datos Personales del Perú),
                visite: <a href="https://www.minjus.gob.pe/protecciondedatos/" className="text-[#00BCD4] underline" target="_blank" rel="noopener noreferrer">minjus.gob.pe/protecciondedatos</a>
              </p>
            </div>
          </Clause>
          <Clause num="8.2" title="Actualizaciones a esta Política">
            <p>
              AxyntraX Automation se reserva el derecho de actualizar la presente Política de Privacidad.
              Cualquier cambio sustancial será notificado a EL CLIENTE con al menos <strong>15 días de
              anticipación</strong> mediante correo electrónico al correo registrado en la cuenta.
              El uso continuado de la plataforma tras la notificación implica la aceptación de los cambios.
            </p>
          </Clause>
        </Section>

        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            © 2026 {EMPRESA} · Todos los derechos reservados · Lima, Perú
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/terminos" className="text-xs text-[#00BCD4] hover:underline font-bold uppercase tracking-wider">
              Términos y Condiciones
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
