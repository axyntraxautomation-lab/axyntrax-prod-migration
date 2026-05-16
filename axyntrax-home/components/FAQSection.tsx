'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ShieldCheck, Zap, MessageSquare, CreditCard, Box, Lock } from 'lucide-react';

const FAQ_DATA = [
  {
    category: "SISTEMA GENERAL",
    icon: <Zap size={20} className="text-[#00D4FF]" />,
    items: [
      { q: "¿Cómo instalo el sistema?", a: "AXYNTRAX es 100% cloud. No requiere instalaciones locales; accede desde www.axyntrax-automation.net con tus credenciales y orquesta tu negocio desde cualquier navegador moderno." },
      { q: "¿Funciona sin internet?", a: "Requiere conexión para la orquestación neural de Cecilia, pero el Panel Jarvis mantiene caché inteligente para que consultes tus datos locales incluso en condiciones de baja señal." },
      { q: "¿Cuánto tiempo toma la implementación?", a: "La activación es inmediata. La configuración personalizada de Cecilia toma entre 24 a 48 horas para alinearse perfectamente al ADN y procesos de tu modelo de negocio." },
      { q: "¿Puedo migrar mis datos actuales?", a: "Sí, facilitamos la importación masiva de clientes y catálogos desde Excel o CSV sin costo. Transformamos tus datos antiguos en inteligencia accionable en minutos." },
      { q: "¿El sistema se actualiza automáticamente?", a: "Constantemente. Todas las mejoras en la IA de Cecilia y nuevas funciones del panel se despliegan globalmente sin interrumpir tu operación ni requerir intervención técnica." },
      { q: "¿Puedo usarlo en varios dispositivos?", a: "Totalmente. AXYNTRAX es multidispositivo; puedes gestionar tu empresa desde tu laptop, tablet y smartphone de forma simultánea con sincronización en tiempo real." },
      { q: "¿Tengo soporte si algo falla?", a: "Absolutamente. Contamos con soporte técnico prioritario vía WhatsApp y remoto liderado por expertos en Perú para asegurar que tu flujo de trabajo nunca se detenga." }
    ]
  },
  {
    category: "PRECIOS Y PAGOS",
    icon: <CreditCard size={20} className="text-[#00D4FF]" />,
    items: [
      { q: "¿Los precios incluyen IGV?", a: "Los precios base no incluyen IGV. Emitimos facturación electrónica legal cumpliendo con toda la normativa de SUNAT para que tu contabilidad esté siempre en orden." },
      { q: "¿Cómo se realiza el pago?", a: "Aceptamos transferencias BCP/BBVA, Yape/Plin y tarjetas de crédito vía pasarela segura. El servicio funciona prepago mensual para garantizar la potencia de tu IA sin interrupciones." },
      { q: "¿Puedo cancelar en cualquier momento?", a: "Sí, en AXYNTRAX creemos en la libertad. No hay penalidades por cancelación; simplemente dejas de renovar tu suscripción cuando lo desees sin preguntas incómodas." },
      { q: "¿Hay contrato de permanencia?", a: "No exigimos contratos forzosos. Tu satisfacción con el ahorro de tiempo y el aumento de ventas que genera nuestra IA es nuestro único y más fuerte lazo de permanencia." },
      { q: "¿Qué pasa si quiero más usuarios?", a: "Nuestros planes incluyen usuarios ilimitados para tu administración interna. Solo pagas por la potencia operativa de Cecilia y los módulos específicos que tu negocio requiera." },
      { q: "¿Tienen descuentos por pago anual?", a: "Sí, premiamos tu visión de largo plazo. Al optar por el plan anual obtienes un descuento directo del 15%, asegurando la automatización de tu empresa por todo el año." }
    ]
  },
  {
    category: "CECILIA IA",
    icon: <MessageSquare size={20} className="text-[#00D4FF]" />,
    items: [
      { q: "¿En qué canales funciona Cecilia?", a: "Cecilia es omnicanal por diseño. Atiende con la misma fluidez y capacidad de cierre en WhatsApp, Facebook Messenger, Instagram Direct y tu chat web institucional." },
      { q: "¿Cecilia responde fuera de horario?", a: "Esa es su mayor ventaja. Cecilia trabaja 24/7 sin descanso, atendiendo prospectos y agendando citas mientras tú descansas o te enfocas en liderar el crecimiento de tu marca." },
      { q: "¿Puedo personalizar las respuestas?", a: "Totalmente. Entrenamos la red neural de Cecilia con la voz, tono y políticas específicas de tu marca para que cada interacción sea profesional, cercana y 100% coherente." },
      { q: "¿Cecilia puede agendar citas?", a: "Sí, Cecilia se sincroniza con tu calendario, reserva espacios disponibles y envía recordatorios automáticos para reducir el ausentismo hasta en un 40% desde el primer mes." },
      { q: "¿Cuántos mensajes puede manejar?", a: "Cecilia posee capacidad de procesamiento masivo. Puede mantener cientos de conversaciones personalizadas simultáneas sin perder velocidad, cortesía ni precisión en la respuesta." },
      { q: "¿Cómo funciona Cecilia en mi WhatsApp?", a: "Se integra directamente a tu línea de WhatsApp Business, actuando como un asesor experto que comprende el lenguaje natural del peruano y guía al cliente hacia la compra o reserva." }
    ]
  },
  {
    category: "MÓDULOS ESPECÍFICOS",
    icon: <Box size={20} className="text-[#00D4FF]" />,
    items: [
      { q: "Legal: ¿Gestiona expedientes y citas?", a: "Sí, el módulo LEX organiza expedientes digitales y Cecilia se encarga de filtrar consultas, agendar citas y recordar plazos procesales críticos automáticamente." },
      { q: "Clínica: ¿Maneja historiales médicos?", a: "Correcto. El módulo MED centraliza historias clínicas digitales bajo estrictas normas de seguridad, agilizando el triaje y permitiendo un seguimiento médico de alto nivel." },
      { q: "Veterinaria: ¿Tiene recordatorios de vacunas?", a: "Indispensable. Cecilia notifica proactivamente a los dueños sobre próximas vacunas y desparasitaciones en el módulo VET, impulsando la recurrencia y salud de los pacientes." },
      { q: "Carwash: ¿Controla turnos en tiempo real?", a: "Sí, el módulo WASH permite reservas por WhatsApp, eliminando colas físicas y permitiéndote optimizar el tiempo de tus operarios con un flujo de vehículos constante." },
      { q: "Residencial: ¿Gestiona pagos de mantenimiento?", a: "Exacto. El módulo RESI automatiza avisos de cobro y Cecilia atiende dudas de propietarios sobre estados de cuenta o reservas de áreas comunes." },
      { q: "Restaurante: ¿Integra pedidos y mesas?", a: "Integración total. El módulo REST permite que Cecilia tome pedidos por WhatsApp y gestione reservas, enviando las órdenes directo a cocina para una atención sin errores." },
      { q: "Logística: ¿Rastrea envíos y almacén?", a: "Sí, el módulo LOGI permite que tus clientes consulten el estado de su mercadería y tú gestiones el stock y la última milla de forma eficiente." },
      { q: "Mecánico: ¿Gestiona órdenes de trabajo?", a: "Definitivamente. El módulo MEC documenta ingresos con fotos y envía presupuestos PDF automáticos para aprobación digital inmediata, agilizando el ciclo de reparación." },
      { q: "Transportes: ¿Venta de boletos digital?", a: "Sí, el módulo TRANS gestiona flotas de pasajeros, permitiendo la venta de boletos digital y el control de conductores y rutas en tiempo real." },
      { q: "Ventas: ¿Tiene CRM y Pipeline?", a: "El módulo VENTAS incluye un CRM inteligente que alimenta un pipeline de ventas automático, permitiendo a tu equipo comercial cerrar más tratos en menos tiempo." },
      { q: "Dental: ¿Odontograma y presupuestos?", a: "Sí, el módulo DENT está especializado en consultorios odontológicos, gestionando odontogramas digitales y presupuestos de tratamientos complejos." },
      { q: "Gimnasio: ¿Membresías y accesos?", a: "El módulo GYM controla el acceso de socios, vencimientos de membresías y permite a Cecilia enviar rutinas y planes nutricionales personalizados." },
      { q: "Ferretería: ¿Inventarios masivos?", a: "Sí, el módulo FERR gestiona miles de SKUs, proveedores y genera cotizaciones PDF al instante para facilitar el despacho de materiales de construcción." }
    ]
  },
  {
    category: "SEGURIDAD Y DATOS",
    icon: <Lock size={20} className="text-[#00D4FF]" />,
    items: [
      { q: "¿Dónde se guardan mis datos?", a: "Utilizamos la infraestructura global de Google Cloud (Firebase), garantizando disponibilidad del 99.9% y los más altos estándares de seguridad y encriptación de datos." },
      { q: "¿Puedo exportar mi información?", a: "Tu información es tuya. En cualquier momento puedes exportar tus bases de datos de clientes, ventas y reportes analíticos a formatos Excel para tu control personal." },
      { q: "¿Qué pasa si cierro mi cuenta?", a: "Respetamos tu privacidad. Al cerrar tu cuenta, puedes solicitar la eliminación definitiva y segura de toda tu información de nuestros servidores corporativos de forma inmediata." },
      { q: "¿Tienen política de privacidad?", a: "Sí, cumplimos estrictamente con la Ley N° 29733 de Protección de Datos Personales en Perú, garantizando un manejo ético y seguro de toda la información de tu negocio." },
      { q: "¿Cumplen con la ley peruana de datos?", a: "Totalmente. AXYNTRAX es una entidad peruana y todos nuestros procesos están alineados con la normativa legal, tributaria y de ciberseguridad vigente en el país." },
      { q: "¿Es segura la información de mis clientes?", a: "Es nuestra prioridad máxima. Encriptamos cada dato con grado militar AES-256 y aplicamos auditorías constantes para proteger tu activo más valioso: la confianza de tus clientes." }
    ]
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <section id="faq" className="py-32 px-6 relative overflow-hidden bg-[#050508]">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-[0.4em] mb-6 inline-block px-4 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/5"
          >
            Soporte Neural 24/7
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            Consultas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF]">Frecuentes</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Todo lo que necesita saber para orquestar su negocio con AXYNTRAX.
          </p>
        </div>

        <div className="space-y-16">
          {FAQ_DATA.map((category, catIndex) => (
            <div key={catIndex} className="space-y-6">
              <div className="flex items-center gap-4 px-4">
                <div className="p-2 bg-[#00D4FF]/10 rounded-lg">
                  {category.icon}
                </div>
                <h3 className="text-xs font-mono font-bold tracking-[0.2em] text-slate-400 uppercase">
                  {category.category}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {category.items.map((item, itemIndex) => {
                  const id = `${catIndex}-${itemIndex}`;
                  const isOpen = openIndex === id;

                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={`group rounded-3xl border transition-all duration-500 ${
                        isOpen 
                          ? 'bg-white/[0.05] border-[#00D4FF]/30' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        className="w-full p-6 text-left flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`transition-colors duration-300 ${isOpen ? 'text-[#00D4FF]' : 'text-slate-600'}`}>
                            <HelpCircle size={18} />
                          </div>
                          <span className={`text-sm font-bold transition-colors ${isOpen ? 'text-white' : 'text-slate-300'}`}>
                            {item.q}
                          </span>
                        </div>
                        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180 text-[#00D4FF]' : 'text-slate-600'}`}>
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-14 pb-6">
                              <p className="text-sm text-slate-500 leading-relaxed">
                                {item.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-10 rounded-[40px] bg-gradient-to-br from-[#00D4FF]/5 to-[#7B2FFF]/5 border border-white/5 text-center"
        >
          <h4 className="text-xl font-bold mb-4">¿Aún tiene dudas específicas?</h4>
          <p className="text-slate-500 text-sm mb-8">Nuestro equipo técnico y Cecilia IA están listos para asesorarlo de forma personalizada.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a 
              href="https://wa.me/51991740590" 
              className="px-8 py-4 bg-[#00D4FF] text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
            >
              Contactar Soporte
            </a>
            <a 
              href="/registro" 
              className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
            >
              Probar Demo Gratis
            </a>
          </div>
        </motion.div>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#00D4FF]/5 blur-[120px] rounded-full -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#7B2FFF]/5 blur-[120px] rounded-full translate-x-1/2" />
    </section>
  );
}
