import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'

const MODULES = [
  {
    id: 'medico',
    icon: '🏥',
    name: 'Clínica Médica',
    desc: 'Gestión de citas, pacientes y CECILIA como asistente clínico 24/7',
    color: '#00d4d4',
    gradient: 'from-cyan-500/20 to-cyan-900/10',
    border: 'rgba(0,212,212,0.25)',
    stats: { citas: 12, mensajes: 48, ingresos: 'S/ 3,240' },
    path: '/module/medico',
    status: 'activo',
  },
  {
    id: 'dentista',
    icon: '🦷',
    name: 'Clínica Dental',
    desc: 'Control de tratamientos, agenda odontológica y cobros automáticos',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-900/10',
    border: 'rgba(59,130,246,0.25)',
    stats: { citas: 8, mensajes: 31, ingresos: 'S/ 2,100' },
    path: '/module/dentista',
    status: 'activo',
  },
  {
    id: 'veterinario',
    icon: '🐾',
    name: 'Clínica Veterinaria',
    desc: 'Fichas de mascotas, vacunas programadas y recordatorios automáticos',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
    border: 'rgba(16,185,129,0.25)',
    stats: { citas: 6, mensajes: 22, ingresos: 'S/ 1,580' },
    path: '/module/veterinario',
    status: 'activo',
  },
  {
    id: 'legal',
    icon: '⚖️',
    name: 'Estudio Legal',
    desc: 'Gestión de casos, documentos legales y atención de consultas por WhatsApp',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-900/10',
    border: 'rgba(245,158,11,0.25)',
    stats: { citas: 5, mensajes: 17, ingresos: 'S/ 4,500' },
    path: '/module/legal',
    status: 'activo',
  },
  {
    id: 'residencial',
    icon: '🏢',
    name: 'Gestión Residencial',
    desc: 'Control de pagos, mantenimiento y comunicación con propietarios',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-900/10',
    border: 'rgba(139,92,246,0.25)',
    stats: { citas: 3, mensajes: 41, ingresos: 'S/ 8,200' },
    path: '/module/residencial',
    status: 'activo',
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    name: 'Restaurant & Food',
    desc: 'Reservas, pedidos por WhatsApp, menú digital y gestión de mesas',
    color: '#ef4444',
    gradient: 'from-red-500/20 to-red-900/10',
    border: 'rgba(239,68,68,0.25)',
    stats: { citas: 18, mensajes: 94, ingresos: 'S/ 5,670' },
    path: '/restaurant',
    status: 'activo',
  },
]

const TOTALS = {
  citas: MODULES.reduce((a, m) => a + m.stats.citas, 0),
  mensajes: MODULES.reduce((a, m) => a + m.stats.mensajes, 0),
}

export default function ModuleSelectorPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = MODULES.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 md:p-10">

      {/* ── HEADER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Selector de{' '}
              <span className="text-[#00d4d4]">Módulos</span>
            </h1>
            <p className="text-[#64748b] text-sm mt-1">
              Elige el vertical de negocio a gestionar — CECILIA activa en todos
            </p>
          </div>

          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-lg">🔍</span>
            <input
              type="text"
              placeholder="Buscar módulo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748b] w-64 focus:outline-none focus:border-[#00d4d4] transition-colors"
            />
          </div>
        </div>

        {/* ── TOTALES RÁPIDOS ─────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          {[
            { label: 'Módulos Activos', value: MODULES.length, icon: '⚡', color: '#00d4d4' },
            { label: 'Citas Totales Hoy', value: TOTALS.citas, icon: '📅', color: '#10b981' },
            { label: 'Mensajes CECILIA', value: TOTALS.mensajes, icon: '💬', color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <div className="text-3xl">{s.icon}</div>
              <div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[#64748b] text-xs font-medium">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── MÓDULOS GRID ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((mod, i) => (
            <motion.div
              key={mod.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 200, damping: 22 }}
              onHoverStart={() => setHovered(mod.id)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => navigate(mod.path)}
              className="relative cursor-pointer group rounded-2xl overflow-hidden"
              style={{
                background: '#111827',
                border: `1px solid ${hovered === mod.id ? mod.border : 'rgba(255,255,255,0.06)'}`,
                transition: 'border-color 0.25s',
                boxShadow: hovered === mod.id ? `0 0 30px ${mod.color}18` : 'none',
              }}
            >
              {/* Color bar top */}
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${mod.color}, transparent)` }}
              />

              <div className="p-6">
                {/* Icon + Status */}
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    animate={{ scale: hovered === mod.id ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="text-4xl leading-none"
                  >
                    {mod.icon}
                  </motion.div>
                  <div className="flex items-center gap-1.5 bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.2)] text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    ACTIVO
                  </div>
                </div>

                {/* Name + Desc */}
                <h3 className="text-lg font-bold mb-1.5 group-hover:text-white transition-colors"
                  style={{ color: hovered === mod.id ? mod.color : 'white' }}>
                  {mod.name}
                </h3>
                <p className="text-[#64748b] text-sm leading-relaxed mb-5">{mod.desc}</p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Citas', value: mod.stats.citas },
                    { label: 'Mensajes', value: mod.stats.mensajes },
                    { label: 'Ingresos', value: mod.stats.ingresos },
                  ].map((s, idx) => (
                    <div key={idx} className="bg-[#0d1420] rounded-xl px-3 py-2 text-center">
                      <div className="text-sm font-bold" style={{ color: mod.color }}>{s.value}</div>
                      <div className="text-[10px] text-[#64748b] font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    background: hovered === mod.id
                      ? `linear-gradient(135deg, ${mod.color}, ${mod.color}aa)`
                      : 'rgba(255,255,255,0.05)',
                    color: hovered === mod.id ? '#000' : mod.color,
                    border: `1px solid ${hovered === mod.id ? mod.color : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  Abrir Módulo
                  <motion.span
                    animate={{ x: hovered === mod.id ? 4 : 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    →
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── MOCK MODE BANNER ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] rounded-2xl px-6 py-4 flex items-center gap-4"
      >
        <div className="text-2xl">🧪</div>
        <div>
          <div className="text-[#8b5cf6] font-bold text-sm">MODO SIMULACIÓN ACTIVO</div>
          <div className="text-[#64748b] text-xs mt-0.5">
            CECILIA opera sin credenciales reales de Meta. Los datos mostrados son de prueba.
            Actualiza <code className="bg-[#0d1420] px-1.5 py-0.5 rounded text-[#00d4d4]">META_ACCESS_TOKEN</code> en Vercel para activar producción real.
          </div>
        </div>
        <div className="ml-auto bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
          v2.3 Mock
        </div>
      </motion.div>
    </div>
  )
}
