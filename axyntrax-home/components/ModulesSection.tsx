import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, 
  PawPrint, 
  Scale, 
  Car, 
  Building, 
  UtensilsCrossed, 
  Truck, 
  Wrench, 
  Bus, 
  TrendingUp, 
  Activity, 
  Dumbbell, 
  Hammer,
  CheckCircle2,
  Plus,
  BarChart3,
  Bot,
  Smartphone,
  Users2,
  ChevronRight,
  MessageCircle,
  LayoutGrid,
  Zap
} from "lucide-react";
import { useState } from "react";

// Precios base (inc. IGV)
const PRICE_BASE = 235;
const PRICE_CONTA = 176;
const PRICE_IA = 117;
const PRICE_APP = 93;
const PRICE_RRHH = 105;
const PRICE_BI = 70;

const COMMON_EXTRAS = [
  { name: "📊 Contabilidad Completa", price: PRICE_CONTA, icon: BarChart3, desc: "Libro ingresos/egresos, SUNAT, Flujo de caja, Reportes mensuales." },
  { name: "👥 Gestión de Personal", price: PRICE_RRHH, icon: Users2, desc: "Control de planillas, asistencias y comisiones." },
  { name: "📱 App Móvil Módulo", price: PRICE_APP, icon: Smartphone, desc: "Acceso total desde iOS/Android para su equipo." },
  { name: "📈 Reportes Avanzados BI", price: PRICE_BI, icon: Zap, desc: "Análisis predictivo y KPIs estratégicos." },
  { name: "🤖 Cecilia IA Integrada", price: PRICE_IA, icon: Bot, desc: "Atención y automatización específica del rubro." }
];

const MODULES = [
  { 
    id: "LEX", icon: Scale, label: "Legal ⚖️", color: "#00D4FF", isPopular: true,
    image: "legal_tech_module_1778798742435.png",
    desc: "Orquestación jurídica completa para estudios y abogados independientes.",
    free: ["Registro de clientes", "Agenda de citas", "Consultas básicas"],
    specificExtras: [
      { name: "Gestión de Expedientes", price: 85 },
      { name: "Documentos Legales digitales", price: 55 },
      { name: "Audiencias y seguimiento", price: 75 },
      { name: "Honorarios y cobros", price: 45 },
      { name: "Contratos digitales con firma", price: 95 },
      { name: "Base de jurisprudencia IA", price: 120 },
      { name: "Homologación SUNAT", price: 65 }
    ]
  },
  { 
    id: "MED", icon: Stethoscope, label: "Clínica 🏥", color: "#7B2FFF", isPopular: true,
    image: "medical_ai_module_1778798728555.png",
    desc: "Transformación digital para centros médicos y policlínicos.",
    free: ["Registro de pacientes", "Agenda médica", "Historial básico"],
    specificExtras: [
      { name: "Historiales clínicos completos", price: 110 },
      { name: "Recetas médicas digitales", price: 40 },
      { name: "Gestión de insumos médicos", price: 85 },
      { name: "Proformas quirúrgicas", price: 95 },
      { name: "Telemedicina integrada", price: 150 },
      { name: "Laboratorio y resultados", price: 130 },
      { name: "Farmacia interna", price: 90 }
    ]
  },
  { 
    id: "VET", icon: PawPrint, label: "Veterinaria 🐾", color: "#00D4FF",
    image: "veterinary_ai_module.png",
    desc: "Gestión integral para el bienestar animal y control de petshops.",
    free: ["Registro de mascotas", "Agenda veterinaria", "Vacunas básicas"],
    specificExtras: [
      { name: "Historias clínicas vet", price: 75 },
      { name: "Control de vacunas y avisos", price: 35 },
      { name: "Insumos y farmacia vet", price: 65 },
      { name: "Cirugías y procedimientos", price: 110 },
      { name: "Peluquería y grooming", price: 55 },
      { name: "Pensión de mascotas", price: 85 },
      { name: "Cremación y servicios", price: 45 }
    ]
  },
  { 
    id: "WASH", icon: Car, label: "Carwash 🚗", color: "#7B2FFF",
    image: "car_wash_tech_module_1778798756312.png",
    desc: "Control de flujo vehicular y servicios de estética automotriz.",
    free: ["Registro de vehículos", "Turnos básicos", "Servicios simples"],
    specificExtras: [
      { name: "Control en tiempo real", price: 65 },
      { name: "Servicios à la carte", price: 35 },
      { name: "Fidelización y membresías", price: 55 },
      { name: "Control de insumos", price: 45 },
      { name: "Caja y cobros digitales", price: 40 },
      { name: "Delivery y recojo", price: 75 },
      { name: "Fotografías del vehículo", price: 25 }
    ]
  },
  { 
    id: "RESI", icon: Building, label: "Residencial 🏢", color: "#00D4FF",
    image: "residential_tech_module.png",
    desc: "Administración inteligente para condominios y edificios.",
    free: ["Registro de propietarios", "Cuotas básicas", "Avisos generales"],
    specificExtras: [
      { name: "Gestión de morosidad", price: 95 },
      { name: "Asambleas virtuales", price: 120 },
      { name: "Control de incidencias", price: 55 },
      { name: "Reserva áreas comunes", price: 65 },
      { name: "Acceso y vigilancia", price: 140 },
      { name: "Proveedores y mantenimiento", price: 85 },
      { name: "Votaciones digitales", price: 75 }
    ]
  },
  { 
    id: "REST", icon: UtensilsCrossed, label: "Restaurante 🍽️", color: "#7B2FFF", isPopular: true,
    image: "restaurant_ia_module_1778798774214.png",
    desc: "Optimización de salón, cocina y delivery para gastronomía.",
    free: ["Carta digital QR", "Pedidos básicos", "Control de mesas"],
    specificExtras: [
      { name: "Mesas en tiempo real", price: 85 },
      { name: "Cocina y comandas", price: 110 },
      { name: "Control stock e insumos", price: 95 },
      { name: "Delivery integrado", price: 75 },
      { name: "Reservas online", price: 55 },
      { name: "Fidelización y puntos", price: 45 },
      { name: "Cierre caja automático", price: 40 }
    ]
  },
  { 
    id: "LOGI", icon: Truck, label: "Logística 📦", color: "#00D4FF",
    image: "logistics_ai_module.png",
    desc: "Control de almacén, rutas y última milla.",
    free: ["Registro de envíos", "Tracking básico", "Clientes básicos"],
    specificExtras: [
      { name: "Rastreo GPS tiempo real", price: 150 },
      { name: "Rutas optimizadas", price: 120 },
      { name: "Control almacén/bodega", price: 95 },
      { name: "Guías y documentos", price: 65 },
      { name: "Flota vehicular", price: 85 },
      { name: "Clientes y contratos", price: 55 },
      { name: "Liquidaciones viaje", price: 75 }
    ]
  },
  { 
    id: "MEC", icon: Wrench, label: "Mecánico 🛠️", color: "#7B2FFF",
    image: "mechanics_tech_module_1778798824123.png",
    desc: "Especialización para talleres de reparación y planchado.",
    free: ["Registro de vehículos", "Órdenes básicas", "Clientes básicos"],
    specificExtras: [
      { name: "Órdenes de trabajo", price: 75 },
      { name: "Diagnóstico digital", price: 45 },
      { name: "Repuestos e insumos", price: 65 },
      { name: "Presupuestos digitales", price: 35 },
      { name: "Historial por vehículo", price: 55 },
      { name: "Garantías y seguimiento", price: 45 },
      { name: "Proveedor repuestos", price: 65 }
    ]
  },
  { 
    id: "TRANS", icon: Bus, label: "Transportes 🚌", color: "#00D4FF",
    image: "logistics_ai_module.png",
    desc: "Gestión de flotas de pasajeros y servicios interprovinciales.",
    free: ["Registro de unidades", "Rutas básicas", "Pasajeros básicos"],
    specificExtras: [
      { name: "Flota GPS", price: 160 },
      { name: "Venta boletos digital", price: 110 },
      { name: "Control conductores", price: 75 },
      { name: "Mantenimiento preventivo", price: 85 },
      { name: "Combustible y gastos", price: 65 },
      { name: "Liquidaciones diarias", price: 55 },
      { name: "Seguros y documentos", price: 45 }
    ]
  },
  { 
    id: "MARK", icon: TrendingUp, label: "Marketing 🚀", color: "#7B2FFF", isPopular: true,
    image: "marketing_ai_module.png",
    desc: "Director de marketing autónomo (Agente MARK) para su negocio.",
    free: ["Posts programados", "IA generativa texto", "Reporte Atlas"],
    specificExtras: [
      { name: "Automatización LinkedIn", price: 199 },
      { name: "Análisis Sentimientos IA", price: 129 },
      { name: "Meta Ads gestionado", price: 299 },
      { name: "Diseño gráfico IA", price: 159 },
      { name: "Seguimiento de Leads", price: 89 }
    ]
  },
  { 
    id: "DENT", icon: Activity, label: "Dental 🦷", color: "#00D4FF",
    image: "medical_ai_module.png",
    desc: "Especializado para consultorios odontológicos y laboratorios dentales.",
    free: ["Registro pacientes", "Agenda dental", "Odontograma básico"],
    specificExtras: [
      { name: "Odontograma digital", price: 95 },
      { name: "Tratamientos/Presupuestos", price: 65 },
      { name: "Radiografías digitales", price: 85 },
      { name: "Control materiales", price: 55 },
      { name: "Seguimiento dental", price: 45 },
      { name: "Consentimientos digitales", price: 35 },
      { name: "Laboratorio dental", price: 110 }
    ]
  },
  { 
    id: "GYM", icon: Dumbbell, label: "Gimnasio 💪", color: "#7B2FFF",
    image: "retail_tech_module_1778798787390.png",
    desc: "Control de socios, membresías y rendimiento deportivo.",
    free: ["Registro de socios", "Membresías básicas", "Asistencia básica"],
    specificExtras: [
      { name: "Control renovaciones", price: 75 },
      { name: "Rutinas/Planes IA", price: 120 },
      { name: "Acceso biométrico", price: 180 },
      { name: "Clases grupales", price: 55 },
      { name: "Nutrición/Físico", price: 85 },
      { name: "Mantenimiento equipos", price: 45 },
      { name: "Vestuarios/Lockers", price: 35 }
    ]
  },
  { 
    id: "FERR", icon: Hammer, label: "Ferretería 🔨", color: "#00D4FF",
    image: "hardware_tech_module.png",
    desc: "Gestión de inventarios masivos y ventas de construcción.",
    free: ["Inventario básico", "Ventas básicas", "Clientes básicos"],
    specificExtras: [
      { name: "Inventario avanzado", price: 130 },
      { name: "Ventas/Cotizaciones", price: 55 },
      { name: "Proveedores/Compras", price: 75 },
      { name: "Series/Garantías", price: 65 },
      { name: "Créditos/Cuotas", price: 85 },
      { name: "Delivery materiales", price: 45 },
      { name: "Catálogo digital", price: 35 }
    ]
  }
];

export default function ModulesSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"base" | "extras" | "precios">("base");
  const [selectedExtras, setSelectedExtras] = useState<Record<string, string[]>>({});

  const toggleExtra = (modId: string, extraName: string) => {
    setSelectedExtras(prev => {
      const current = prev[modId] || [];
      if (current.includes(extraName)) {
        return { ...prev, [modId]: current.filter(e => e !== extraName) };
      }
      return { ...prev, [modId]: [...current, extraName] };
    });
  };

  const calculateTotal = (modId: string) => {
    const mod = MODULES.find(m => m.id === modId);
    if (!mod) return 0;
    
    let total = PRICE_BASE;
    const selected = selectedExtras[modId] || [];
    
    selected.forEach(name => {
      const spec = mod.specificExtras.find(e => e.name === name);
      const comm = COMMON_EXTRAS.find(e => e.name === name);
      if (spec) total += spec.price;
      if (comm) total += comm.price;
    });
    
    return total;
  };

  return (
    <section id="modulos" className="relative py-32 overflow-hidden bg-[#020204]">
      {/* Premium Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/30 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4FF]/5 border border-[#00D4FF]/20 text-[#00D4FF] text-xs font-bold tracking-[0.2em] mb-8"
          >
            <Zap size={14} className="animate-pulse" /> 13 SOLUCIONES MAESTRAS
          </motion.div>
          <h2 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-8 leading-[0.9]">
            <span className="block text-2xl text-slate-500 font-mono mb-4">RUC: 10406750324 | AREQUIPA, PERÚ (SEDE CENTRAL)</span>
            Arme su Plan <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-white to-[#7B2FFF]">Escala a tu Medida</span>
          </h2>
          <p className="text-slate-500 text-xl max-w-3xl mx-auto leading-relaxed">
            Personalización absoluta para el empresario peruano. Elija su rubro, active sus módulos gratuitos y sume potencia contable y tecnológica según su necesidad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
          {MODULES.map((mod, index) => {
            const Icon = mod.icon;
            const isExpanded = expandedId === mod.id;
            const total = calculateTotal(mod.id);

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`group relative rounded-[48px] overflow-hidden bg-[#0A0A0F] border ${isExpanded ? 'border-[#00D4FF]/40' : 'border-white/5'} transition-all duration-700 flex flex-col`}
                style={{
                  boxShadow: isExpanded ? `0 0 100px ${mod.color}15` : "none",
                }}
              >
                {mod.isPopular && (
                  <div className="absolute top-6 right-6 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-[10px] font-black tracking-widest shadow-lg animate-bounce">
                    MÁS POPULAR
                  </div>
                )}

                {/* Card Header & Image */}
                <div className="relative h-64 w-full overflow-hidden">
                  <motion.img 
                    animate={{ scale: isExpanded ? 1.05 : 1 }}
                    src={`/images/${mod.image}`} 
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-opacity duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/20 to-transparent" />
                  <div 
                    className="absolute bottom-8 left-8 w-20 h-20 rounded-3xl flex items-center justify-center backdrop-blur-2xl border border-white/10 shadow-2xl"
                    style={{ background: `${mod.color}15` }}
                  >
                    <Icon size={36} style={{ color: mod.color }} />
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-10 flex-1 flex flex-col">
                  <h3 className="text-3xl font-black text-white mb-2">{mod.label}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">{mod.desc}</p>

                  <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl">
                    {["base", "extras", "precios"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      {activeTab === "base" && (
                        <motion.div
                          key="base"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-4"
                        >
                          <p className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CheckCircle2 size={12} /> Incluidos en Plan Base
                          </p>
                          {mod.free.map((f, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                              <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
                                <LayoutGrid size={14} />
                              </div>
                              <span className="text-sm text-slate-300 font-bold">{f}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeTab === "extras" && (
                        <motion.div
                          key="extras"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-4"
                        >
                          <p className="text-[10px] font-mono text-[#7B2FFF] uppercase tracking-widest mb-6">Módulos À La Carte</p>
                          <div className="grid grid-cols-1 gap-3">
                            {[...mod.specificExtras, ...COMMON_EXTRAS].map((extra, i) => {
                              const isSelected = selectedExtras[mod.id]?.includes(extra.name);
                              return (
                                <button
                                  key={i}
                                  onClick={() => toggleExtra(mod.id, extra.name)}
                                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-[#00D4FF]/10 border-[#00D4FF]/40' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#00D4FF] text-black' : 'bg-white/5 text-slate-500'}`}>
                                      {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                                    </div>
                                    <div className="text-left">
                                      <span className={`text-sm font-bold block ${isSelected ? 'text-white' : 'text-slate-400'}`}>{extra.name}</span>
                                      <span className="text-[10px] text-slate-400 block font-medium">S/ {extra.price} inc. IGV</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "precios" && (
                        <motion.div
                          key="precios"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6"
                        >
                          <div className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-slate-400 text-sm">Plan Base {mod.label}</span>
                              <span className="text-white font-bold">S/ {PRICE_BASE}</span>
                            </div>
                            {(selectedExtras[mod.id] || []).map((name, i) => {
                              const price = [...mod.specificExtras, ...COMMON_EXTRAS].find(e => e.name === name)?.price || 0;
                              return (
                                  <div key={i} className="flex justify-between items-center mb-3 text-xs">
                                    <span className="text-slate-300 font-medium">{name}</span>
                                    <span className="text-[#00D4FF] font-bold">+ S/ {price}</span>
                                  </div>
                              );
                            })}
                            <div className="h-[1px] bg-white/10 my-6" />
                            <div className="flex justify-between items-end">
                              <span className="text-xl font-black text-white">TOTAL ESTIMADO</span>
                                  <div className="text-right">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF]">S/ {total}</span>
                                    <p className="text-[10px] text-slate-300 uppercase font-mono font-bold">inc. IGV / mensual</p>
                                  </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div className="mt-12 flex flex-col gap-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                      className="w-full py-5 rounded-3xl border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                    >
                      {isExpanded ? "Cerrar Configuración" : "Configurar Mi Plan"}
                      <ChevronRight size={14} className={`transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <a
                      href={`https://wa.me/51991740590?text=Hola Cecilia, me interesa el modulo ${mod.label} con los siguientes extras: ${(selectedExtras[mod.id] || []).join(', ')}. Mi presupuesto estimado es S/ ${total}.`}
                      className="w-full py-5 rounded-3xl bg-gradient-to-r from-[#00D4FF] to-[#7B2FFF] text-black font-black text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] transition-all flex items-center justify-center gap-3"
                    >
                      SOLICITAR ACTIVACIÓN <MessageCircle size={16} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
