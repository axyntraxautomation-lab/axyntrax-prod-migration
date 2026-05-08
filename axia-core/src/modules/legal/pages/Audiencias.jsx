import { useOutletContext } from 'react-router'
import { Calendar, Gavel, Clock, MapPin, ExternalLink } from 'lucide-react'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'

export default function Audiencias() {
  const { config } = useOutletContext()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Agenda de Audiencias</h2>
         <span className="text-xs font-black uppercase tracking-widest text-[#ef4444] animate-pulse">En Vivo</span>
      </div>

      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Calendario', icon: Calendar },
        ]}
      />

      <div className="space-y-4">
         {[
           { time: '10:00 AM', case: '00124-2026', type: 'Vista de Causa', court: '4to Juzgado Civil', link: 'https://pj.gob.pe/sala-1' },
           { time: '12:30 PM', case: '00542-2025', type: 'Audiencia de Pruebas', court: 'Sede Central - Sala 402', link: null },
           { time: '15:20 PM', case: '00981-2026', type: 'Declaración Preventiva', court: 'Presencial - Ministerio Publico', link: null },
         ].map((a, i) => (
           <div key={i} className="bg-black border border-white/10 rounded-3xl p-8 flex items-center justify-between group hover:border-[#ef4444]/30 transition-all">
              <div className="flex items-center gap-8">
                 <div className="text-center">
                    <p className="text-xl font-black text-white">{a.time.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{a.time.split(' ')[1]}</p>
                 </div>
                 <div className="h-10 w-px bg-white/5" />
                 <div>
                    <h3 className="text-sm font-black text-white uppercase">{a.case}</h3>
                    <p className="text-[10px] font-bold text-[#ef4444] uppercase mt-1">{a.type}</p>
                 </div>
                 <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                    <MapPin className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-bold text-white/40 uppercase">{a.court}</span>
                 </div>
              </div>
              
              {a.link ? (
                <button className="flex items-center gap-2 px-4 py-2 bg-turquoise text-black font-black uppercase text-[9px] rounded-lg hover:bg-white transition-all">
                   <ExternalLink className="w-3 h-3" /> Unirse a Sala
                </button>
              ) : (
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/40 font-black uppercase text-[9px] rounded-lg border border-white/5">
                   Asist. Presencial
                </button>
              )}
           </div>
         ))}
      </div>
    </div>
  )
}
