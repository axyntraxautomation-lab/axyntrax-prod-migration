import { motion } from 'framer-motion'
import { ResumenDiario } from './components/ResumenDiario'
import { FlujoCaja } from './components/FlujoCaja'
import { LeadSyncWidget } from './components/LeadSyncWidget'
import { GastosPendientes } from './components/GastosPendientes'
import { AxiaPerformance } from './components/AxiaPerformance'
import { AxiaAlertasLeads } from './components/AxiaAlertasLeads'
import { useTenantStore } from '@/store/useTenantStore'
import { LayoutGrid, Target, Users } from 'lucide-react'

export default function DashboardMiguel() {
  const { tenant } = useTenantStore()

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8"
    >
      {/* Header Personalizado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-turquoise/20 text-turquoise text-[10px] font-black uppercase tracking-widest rounded-md border border-turquoise/30">
                 Master Command Center
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">AxyntraX Automation v4.0</span>
           </div>
           <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
             Dashboard Ejecutivo
           </h2>
           <p className="text-white/60 mt-2 text-sm italic">
             Bienvenido, <span className="text-white font-bold">{tenant.admin}</span>. Control total del ecosistema activo.
           </p>
        </div>
      </div>

      {/* 1. Resumen Diario (KPIs) */}
      <ResumenDiario />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Financials & Leads */}
        <div className="lg:col-span-2 space-y-8">
           {/* 2. Lead Sync Widget */}
           <LeadSyncWidget />
           
           {/* 3. Performance & Stats */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 4. Clients by Bot (Sub-card in performance) */}
              <div className="bg-black border border-white/10 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4 text-turquoise" />
                  Clientes por Bot
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Clinica Bot', count: 45, color: '#00CED1' },
                    { name: 'Legal Bot', count: 32, color: '#FFFFFF' },
                    { name: 'Restaurant Bot', count: 47, color: '#00CED1' },
                  ].map((bot, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span className="text-white/70">{bot.name}</span>
                        <span className="text-white">{bot.count}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-turquoise" style={{ width: `${(bot.count / 124) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 6. Axia Alertas Leads */}
              <AxiaAlertasLeads />
              
              {/* 7. Axia Performance */}
              <AxiaPerformance />
           </div>
        </div>

        {/* Right Column: Funds & Expenses */}
        <div className="space-y-8">
          {/* 5. Flujo Financiero */}
          <FlujoCaja />
          
          {/* 6. Gastos Pendientes */}
          <GastosPendientes />
        </div>
      </div>
    </motion.div>
  )
}
