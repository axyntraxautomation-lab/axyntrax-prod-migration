import { motion } from 'framer-motion'
import { ExternalLink, User, RefreshCw } from 'lucide-react'
import { useLeadStore } from '@/store/useLeadStore'
import { LeadSyncService } from '@/lib/services/LeadSyncService'
import { cn } from '@/lib/utils'

export const LeadSyncWidget = () => {
  const { getFilteredLeads, updateLead, newCount } = useLeadStore()
  const leads = getFilteredLeads()
  
  const statusColors = {
    nuevo: 'bg-turquoise/20 text-turquoise border-turquoise/30',
    contactado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    demo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cerrado: 'bg-green-500/20 text-green-400 border-green-500/30',
    perdido: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const handleActivate = async (id) => {
    try {
      await LeadSyncService.activateAccess(id)
      updateLead(id, { status: 'cerrado' })
    } catch (error) {
      console.error('Error activando lead:', error)
    }
  }

  return (
    <div className="bg-black border border-white/10 rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Leads Sincronizados (Web)</h3>
          <p className="text-[9px] text-white/30 font-bold uppercase mt-1">Conexion actua con Netlify API</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/30">
             <RefreshCw className="w-4 h-4" />
           </button>
           <span className="text-[10px] font-bold text-turquoise bg-turquoise/10 px-2 py-0.5 rounded-full uppercase">
             {newCount} Nuevos
           </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] uppercase font-black tracking-tighter text-white/40">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Plan / Bot</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-sm font-bold text-white">{lead.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-white/70">{lead.plan}</p>
                  <p className="text-[9px] font-black text-white/30 uppercase">{lead.bot}</p>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-white/40">{new Date(lead.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 rounded-md text-[9px] font-black uppercase border", statusColors[lead.status])}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleActivate(lead.id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-turquoise hover:text-white transition-colors group-hover:translate-x-1 duration-300"
                  >
                    Activar Acceso <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
