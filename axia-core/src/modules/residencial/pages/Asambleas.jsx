import { useOutletContext } from 'react-router'
import { Calendar, Users, MapPin, Clock, ExternalLink } from 'lucide-react'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'

export default function Asambleas() {
  const { config } = useOutletContext()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Asambleas de Residentes</h2>

      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Calendario', icon: Calendar },
        ]}
      />

      <div className="space-y-4">
         {[
           { date: '25 Abr', time: '19:00', title: 'Asamblea Extraordinaria - Mantenimiento Ascensores', place: 'Sala de Usos Multiples (SUM)', type: 'Presencial' },
           { date: '02 May', time: '10:30', title: 'Reunión de Junta Directiva - Balance Trimestral', place: 'Google Meet', type: 'Virtual' },
         ].map((a, i) => (
           <div key={i} className="bg-black border border-white/10 rounded-3xl p-8 flex items-center justify-between group hover:border-[#3b82f6]/30 transition-all">
              <div className="flex items-center gap-8">
                 <div className="text-center w-16">
                    <p className="text-xl font-black text-white leading-none">{a.date.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">{a.date.split(' ')[1]}</p>
                 </div>
                 <div className="h-10 w-px bg-white/5" />
                 <div>
                    <h3 className="text-sm font-black text-white uppercase">{a.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-white/20" />
                          <span className="text-[10px] font-bold text-white/40 uppercase">{a.time}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-white/20" />
                          <span className="text-[10px] font-bold text-white/40 uppercase">{a.place}</span>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <span className={cn(
                   "text-[9px] font-black uppercase px-3 py-1 rounded-lg",
                   a.type === 'Virtual' ? "bg-turquoise/10 text-turquoise" : "bg-white/5 text-white/40"
                 )}>
                   {a.type}
                 </span>
                 {a.type === 'Virtual' && (
                   <button className="p-2 bg-white/5 rounded-lg hover:bg-white hover:text-black transition-all">
                      <ExternalLink className="w-4 h-4" />
                   </button>
                 )}
              </div>
           </div>
         ))}
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
