import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { INTERNAL_API_URL } from '@/lib/constants'

const API_BASE = INTERNAL_API_URL

// Mock leads para visualización inmediata
const MOCK_LEADS = [
  { id:1, score:'hot', lastMessage:'¿Cuánto cuesta el plan Diamante?', intent:'precio', timestamp:'2026-04-23T14:32:00Z', sessionId:'axia_001' },
  { id:2, score:'hot', lastMessage:'Quiero una demo para mi clínica', intent:'demo', timestamp:'2026-04-23T13:15:00Z', sessionId:'axia_002' },
  { id:3, score:'warm', lastMessage:'Información sobre el módulo legal', intent:'legal', timestamp:'2026-04-23T12:45:00Z', sessionId:'axia_003' },
  { id:4, score:'hot', lastMessage:'¿Tienen integración con SUNAT?', intent:'precio', timestamp:'2026-04-23T11:20:00Z', sessionId:'axia_004' },
  { id:5, score:'warm', lastMessage:'Cuéntame sobre el módulo restaurant', intent:'restaurant', timestamp:'2026-04-23T10:05:00Z', sessionId:'axia_005' },
  { id:6, score:'cold', lastMessage:'Hola, ¿qué hacen?', intent:'saludo', timestamp:'2026-04-23T09:30:00Z', sessionId:'axia_006' },
  { id:7, score:'hot', lastMessage:'¿Puedo probar 7 días gratis?', intent:'demo', timestamp:'2026-04-23T08:55:00Z', sessionId:'axia_007' },
]

const MOCK_CONVERSATIONS = [
  {
    id:1, sessionId:'axia_001', score:'hot',
    summary:'Cliente consulta por Plan Diamante para clínica médica en Miraflores. Alta intención de compra. Solicitó cotización formal.',
    pros:['Alto presupuesto confirmado','Decisor directo','Sector salud = ROI claro'],
    cons:['Requiere integración con sistema propio'],
    recommendation:'Agendar demo en 24h. Alta probabilidad de cierre.',
    timestamp:'14:32'
  },
  {
    id:2, sessionId:'axia_002', score:'hot',
    summary:'Propietario de clínica dental interesado en automatización de citas y recordatorios. Actualmente usan Excel. Gran oportunidad.',
    pros:['Pain point clarísimo','Operación actual muy manual','Decisor = dueño'],
    cons:['Presupuesto no confirmado'],
    recommendation:'Mostrar caso de éxito dental. Ofrecer prueba 7 días.',
    timestamp:'13:15'
  },
  {
    id:3, sessionId:'axia_003', score:'warm',
    summary:'Estudio legal de 5 abogados. Buscan automatizar seguimiento de casos y captura de clientes fuera del horario.',
    pros:['Necesidad real identificada','Sector legal = ticket alto'],
    cons:['Evaluando otras opciones','Proceso de decisión largo'],
    recommendation:'Enviar caso de éxito legal. Follow-up en 3 días.',
    timestamp:'12:45'
  },
]

const SCORE_STYLES = {
  hot: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#ef4444', label: '🔥 Hot' },
  warm: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b', label: '🌡 Warm' },
  cold: { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.2)', color: '#64748b', label: '❄️ Cold' },
}

export default function AxiaDashboardPage() {
  const [leads, setLeads] = useState(MOCK_LEADS)
  const [convos, setConvos] = useState(MOCK_CONVERSATIONS)
  const [activeConvo, setActiveConvo] = useState(null)
  const [stats, setStats] = useState({ totalLeads: 7, hotLeads: 4, conversions: 1 })

  useEffect(() => {
    fetch(`${API_BASE}/api/chat-web`)
      .then(r => r.json())
      .then(d => {
        if (d.leads?.length) setLeads(d.leads)
        if (d.stats) setStats(d.stats)
      })
      .catch(() => {}) // fallback mock
  }, [])

  const hot = leads.filter(l => l.score === 'hot').length
  const warm = leads.filter(l => l.score === 'warm').length

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 md:p-8">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Dashboard <span className="text-[#00d4d4]">AXIA Analytics</span>
            </h1>
            <p className="text-[#64748b] text-sm mt-1">Reportes de conversaciones B2B en tiempo real · 🧪 Modo Simulación</p>
          </div>
          <div className="bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] text-[#8b5cf6] text-xs font-bold px-3 py-1.5 rounded-lg">
            🧪 MOCK DATA
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Leads Captados', value: leads.length, icon:'🎯', color:'#00d4d4', sub:`Hoy vía AXIA Web` },
          { label:'Hot Leads', value: leads.filter(l => l.score > 80).length, icon:'🔥', color:'#ef4444', sub:`Alta prioridad` },
          { label:'Warm Leads', value: leads.filter(l => l.score <= 80).length, icon:'🌡️', color:'#f59e0b', sub:`En seguimiento` },
          { label:'Conversiones Est.', value: Math.max(1, Math.floor(leads.length*0.23)), icon:'💰', color:'#10b981', sub:`Tasa 23% promedio` },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background:`linear-gradient(90deg,${k.color},transparent)` }} />
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="text-3xl font-extrabold" style={{ color:k.color }}>{k.value}</div>
            <div className="text-xs text-[#64748b] font-semibold mt-1">{k.label}</div>
            <div className="text-[10px] text-[#475569] mt-0.5">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEADS TABLE */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          className="xl:col-span-2 space-y-6">
          
          {/* funnel info */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Embudo de Conversión</h3>
            <div className="space-y-4">
              {[
                { label: 'Sesiones', value: 1240, percent: 100, color: 'bg-cyan-500' },
                { label: 'Leads Captados', value: 342, percent: 27, color: 'bg-cyan-400' },
                { label: 'Citas / Demos', value: 84, percent: 7, color: 'bg-cyan-300' },
                { label: 'Cierres', value: 12, percent: 1, color: 'bg-cyan-200' },
              ].map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white">{s.value}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${s.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* sentiment widget */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sentimiento IA</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="text-xl font-black text-emerald-400">88%</div>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="226" strokeDashoffset="27" />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                 <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                   <span>Positivo</span>
                   <span className="text-emerald-400">72%</span>
                 </div>
                 <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                   <span>Neutral</span>
                   <span className="text-slate-400">24%</span>
                 </div>
                 <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                   <span>Crítico</span>
                   <span className="text-red-400">4%</span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI CONVERSATION REPORTS */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
          className="xl:col-span-3 bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-bold mb-6 flex items-center gap-2">
            🤖 <span>Resúmenes de IA por Conversación</span>
          </h2>

          {activeConvo ? (
            <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}
              className="space-y-4">
              <button onClick={() => setActiveConvo(null)} className="text-[10px] font-black uppercase text-cyan-400 hover:text-cyan-300 transition-colors mb-2">
                ← Volver al listado
              </button>
              <div className="bg-[#0d1420] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full" style={SCORE_STYLES[activeConvo.score] ? {background:SCORE_STYLES[activeConvo.score].bg,color:SCORE_STYLES[activeConvo.score].color,border:`1px solid ${SCORE_STYLES[activeConvo.score].border}`} : {}}>
                    {SCORE_STYLES[activeConvo.score]?.label}
                  </span>
                  <span className="text-[#64748b] text-[10px] font-bold uppercase tracking-widest">{activeConvo.timestamp}</span>
                </div>
                <p className="text-sm text-[#cbd5e1] leading-relaxed mb-6 italic">"{activeConvo.summary}"</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] rounded-2xl p-4">
                    <div className="text-[10px] font-black text-[#10b981] uppercase tracking-widest mb-3">✅ Puntos Fuertes</div>
                    <ul className="space-y-2">
                      {activeConvo.pros.map((p,i) => <li key={i} className="text-[11px] text-[#94a3b8] flex gap-2"><span>•</span> {p}</li>)}
                    </ul>
                  </div>
                  <div className="bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.12)] rounded-2xl p-4">
                    <div className="text-[10px] font-black text-[#ef4444] uppercase tracking-widest mb-3">⚠️ Objeciones</div>
                    <ul className="space-y-2">
                      {activeConvo.cons.map((c,i) => <li key={i} className="text-[11px] text-[#94a3b8] flex gap-2"><span>•</span> {c}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-5">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">🎯 Estrategia de Cierre Sugerida</div>
                  <div className="text-sm text-white font-medium">{activeConvo.recommendation}</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {convos.map((c, i) => {
                const s = SCORE_STYLES[c.score]
                return (
                  <motion.div key={c.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    onClick={() => setActiveConvo(c)}
                    className="p-5 rounded-2xl border cursor-pointer hover:bg-white/[0.02] hover:border-cyan-500/30 transition-all group"
                    style={{ background:'#0d1420', borderColor:'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
                        {s.label}
                      </div>
                      <span className="text-[#64748b] text-[10px] font-bold">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2 mb-3">{c.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {c.pros.slice(0,2).map((p,j) => (
                          <span key={j} className="text-[9px] font-black uppercase text-[#10b981]">✓ {p.split(' ')[0]}</span>
                        ))}
                      </div>
                      <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Analizar <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

    </div>
  )
}
