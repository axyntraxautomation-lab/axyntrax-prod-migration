/**
 * PricingPage.jsx — Selector de módulos AXYNTRAX
 * El cliente selecciona sus módulos, ve el precio en soles + IGV en tiempo real,
 * y puede solicitar demo o activar con su KEY.
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Stethoscope, Smile, PawPrint, Scale, Building2,
  UtensilsCrossed, Zap, Check, MessageCircle, Star
} from 'lucide-react'

const IGV = 0.18

// ── Catálogo de módulos ──────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'medico',
    nombre: 'MediBot',
    descripcion: 'Citas médicas, expedientes y recordatorios automáticos',
    precio: 120,
    icon: Stethoscope,
    color: '#00bcd4',
    popular: true,
    features: ['Agenda inteligente', 'Historial clínico', 'Recordatorios WSP', 'Recetas digitales'],
  },
  {
    id: 'dentista',
    nombre: 'DentBot',
    descripcion: 'Odontograma digital, citas y planes de tratamiento',
    precio: 110,
    icon: Smile,
    color: '#26c6da',
    popular: false,
    features: ['Odontograma interactivo', 'Planes de pago', 'Fotos clínicas', 'Seguimiento post-tratamiento'],
  },
  {
    id: 'veterinario',
    nombre: 'VetBot',
    descripcion: 'Control de mascotas, vacunas y citas veterinarias',
    precio: 90,
    icon: PawPrint,
    color: '#4dd0e1',
    popular: false,
    features: ['Ficha por mascota', 'Calendario vacunas', 'Alertas de desparasitación', 'Historia clínica animal'],
  },
  {
    id: 'legal',
    nombre: 'LegalBot',
    descripcion: 'Gestión de casos, documentos y agenda de estudio legal',
    precio: 130,
    icon: Scale,
    color: '#00acc1',
    popular: false,
    features: ['Gestión de expedientes', 'Agenda de audiencias', 'Documentos firmados', 'CRM legal'],
  },
  {
    id: 'residencial',
    nombre: 'ResidencialBot',
    descripcion: 'Cobros de mantenimiento, incidencias y comunicados',
    precio: 100,
    icon: Building2,
    color: '#0097a7',
    popular: false,
    features: ['Cobros automáticos', 'Reportes de incidencias', 'Comunicados masivos', 'Control de acceso'],
  },
  {
    id: 'restaurant',
    nombre: 'RestaurantBot',
    descripcion: 'Reservas, pedidos y atención gastronómica automatizada',
    precio: 110,
    icon: UtensilsCrossed,
    color: '#00838f',
    popular: false,
    features: ['Reservas en línea', 'Menú del día WSP', 'Pedidos delivery', 'Fidelización de comensales'],
  },
]

const BASE_PRICE    = 99   // Plan base (AXIA Core)
const AXIA_PREMIUM  = 150  // AXIA IA ejecutiva
const USER_EXTRA    = 15   // Por usuario adicional (incluye 2)

// ── Card de módulo ───────────────────────────────────────────────────────────
function ModuleCard({ mod, selected, onToggle }) {
  const Icon = mod.icon
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggle(mod.id)}
      className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
        selected
          ? 'border-[#00bcd4] bg-[#00bcd4]/10 shadow-lg shadow-[#00bcd4]/10'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      }`}
    >
      {/* Popular badge */}
      {mod.popular && (
        <div className="absolute -top-3 -right-2 flex items-center gap-1 px-2 py-0.5 bg-[#00bcd4] text-black text-[9px] font-black uppercase tracking-widest rounded-full">
          <Star className="w-2.5 h-2.5" fill="currentColor" />
          Más Popular
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icono */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${mod.color}20`, border: `1px solid ${mod.color}40` }}
          >
            <Icon className="w-5 h-5" style={{ color: mod.color }} />
          </div>
          {/* Info */}
          <div className="min-w-0">
            <p className="text-sm font-black text-white uppercase tracking-tight">{mod.nombre}</p>
            <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{mod.descripcion}</p>
          </div>
        </div>
        {/* Precio + checkbox */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="text-sm font-black text-white">S/. {mod.precio}</p>
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            selected ? 'bg-[#00bcd4] border-[#00bcd4]' : 'border-white/30'
          }`}>
            {selected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
          </div>
        </div>
      </div>

      {/* Features (cuando seleccionado) */}
      {selected && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-1"
        >
          {mod.features.map(f => (
            <li key={f} className="flex items-center gap-1.5 text-[10px] text-[#00bcd4]">
              <Check className="w-2.5 h-2.5 flex-shrink-0" />
              {f}
            </li>
          ))}
        </motion.ul>
      )}
    </motion.button>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function PricingPage() {
  const [selected,    setSelected]    = useState([])
  const [axiaEnabled, setAxiaEnabled] = useState(false)
  const [extraUsers,  setExtraUsers]  = useState(0)

  const toggleModule = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const totals = useMemo(() => {
    const modTotal   = selected.reduce((acc, id) => {
      const mod = MODULES.find(m => m.id === id)
      return acc + (mod?.precio || 0)
    }, 0)
    const subtotal   = BASE_PRICE + modTotal + (axiaEnabled ? AXIA_PREMIUM : 0) + extraUsers * USER_EXTRA
    const igv        = subtotal * IGV
    const total      = subtotal + igv
    return { subtotal, igv, total, modTotal }
  }, [selected, axiaEnabled, extraUsers])

  const waPhone   = '51991740590'
  const waMessage = encodeURIComponent(
    `Hola CECILIA 👋 Me interesa el sistema AXYNTRAX.\n` +
    `Módulos: ${selected.length > 0 ? selected.map(id => MODULES.find(m => m.id === id)?.nombre).join(', ') : 'Solo base'}\n` +
    `Total estimado: S/. ${totals.total.toFixed(2)} + IGV\n¿Podemos hablar?`
  )

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00bcd4]/10 border border-[#00bcd4]/30 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00bcd4] mb-4">
            <Zap className="w-3 h-3" />
            Sistema Modular AXYNTRAX
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-3">
            Elige tus <span style={{ color: '#00bcd4' }}>módulos</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            Arma tu sistema a medida. Solo pagas lo que necesitas. 
            Precios en soles peruanos con IGV incluido.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Lista de módulos ── */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
              Módulos disponibles — selecciona los que necesitas
            </p>
            {MODULES.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <ModuleCard
                  mod={mod}
                  selected={selected.includes(mod.id)}
                  onToggle={toggleModule}
                />
              </motion.div>
            ))}

            {/* AXIA Premium toggle */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setAxiaEnabled(!axiaEnabled)}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                axiaEnabled
                  ? 'border-purple-500/60 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase">AXIA Premium — IA Ejecutiva</p>
                    <p className="text-[11px] text-white/50">Resúmenes ejecutivos, alertas inteligentes y análisis de negocio</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-black text-white">S/. {AXIA_PREMIUM}</p>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    axiaEnabled ? 'bg-purple-500 border-purple-500' : 'border-white/30'
                  }`}>
                    {axiaEnabled && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Usuarios extra */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
              <div>
                <p className="text-sm font-bold text-white">Usuarios adicionales</p>
                <p className="text-[11px] text-white/40">2 usuarios incluidos en el plan base</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExtraUsers(Math.max(0, extraUsers - 1))}
                  className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
                >−</button>
                <span className="text-sm font-black text-white w-4 text-center">{extraUsers}</span>
                <button
                  onClick={() => setExtraUsers(Math.min(20, extraUsers + 1))}
                  className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
                >+</button>
                <span className="text-[11px] text-white/40">× S/. {USER_EXTRA}/mes</span>
              </div>
            </div>
          </div>

          {/* ── Resumen de precio ── */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-6 bg-[#111827] border border-white/10 rounded-3xl p-6 space-y-4"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tu plan</p>

              {/* Desglose */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Base AXIA Core</span>
                  <span>S/. {BASE_PRICE}</span>
                </div>
                {selected.map(id => {
                  const mod = MODULES.find(m => m.id === id)
                  return mod ? (
                    <div key={id} className="flex justify-between text-white/60">
                      <span>{mod.nombre}</span>
                      <span>S/. {mod.precio}</span>
                    </div>
                  ) : null
                })}
                {axiaEnabled && (
                  <div className="flex justify-between text-purple-400">
                    <span>AXIA Premium</span>
                    <span>S/. {AXIA_PREMIUM}</span>
                  </div>
                )}
                {extraUsers > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>{extraUsers} usuario(s) extra</span>
                    <span>S/. {extraUsers * USER_EXTRA}</span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-2 space-y-1.5">
                  <div className="flex justify-between text-white/50 text-xs">
                    <span>Subtotal</span>
                    <span>S/. {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-xs">
                    <span>IGV (18%)</span>
                    <span>S/. {totals.igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-lg pt-1">
                    <span>TOTAL</span>
                    <span className="text-[#00bcd4]">S/. {totals.total.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-white/30 text-right">por mes · precio con IGV</p>
                </div>
              </div>

              {/* CTA Principal */}
              <a
                href={`https://wa.me/${waPhone}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#00bcd4] hover:bg-[#0097a7] text-black font-black text-sm uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-[#00bcd4]/20"
              >
                <MessageCircle className="w-4 h-4" />
                Solicitar Demo Gratis
              </a>
              <p className="text-[10px] text-white/30 text-center">
                14 días de prueba gratuita · Sin tarjeta de crédito
              </p>

              {/* Beneficios clave */}
              <div className="pt-2 space-y-2">
                {['WhatsApp CECILIA 24/7', 'Dashboard gerencial', 'Activación por KEY', 'Soporte incluido'].map(b => (
                  <div key={b} className="flex items-center gap-2 text-[11px] text-white/50">
                    <Check className="w-3 h-3 text-[#00bcd4]" />
                    {b}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
