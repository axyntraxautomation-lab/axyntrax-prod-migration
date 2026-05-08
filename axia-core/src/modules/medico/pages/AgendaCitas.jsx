import { useOutletContext } from 'react-router'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { BaseActionsBar } from '@/components/base/BaseActionsBar'
import { cn } from '@/lib/utils'

export default function AgendaCitas() {
  const { config } = useOutletContext()
  
  const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Agenda Médica</h2>
         <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg text-white/40"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-xs font-black uppercase tracking-widest text-white/60 mx-4">21 Abr, 2026</span>
            <button className="p-2 hover:bg-white/5 rounded-lg text-white/40"><ChevronRight className="w-5 h-5" /></button>
         </div>
      </div>

      <BaseActionsBar 
        primaryColor={config.primaryColor}
        onNew={() => {}}
        actions={[
          { label: 'Filtros', icon: Filter },
          { label: 'Excel', icon: CalendarIcon },
        ]}
      />

      <div className="bg-black border border-white/10 rounded-3xl overflow-hidden">
         <div className="grid grid-cols-1 divide-y divide-white/5">
            {hours.map((hour) => (
              <div key={hour} className="group flex min-h-[80px] hover:bg-white/5 transition-colors">
                 <div className="w-20 p-4 border-r border-white/5 text-[10px] font-mono text-white/20 uppercase">
                    {hour}
                 </div>
                 <div className="flex-1 p-4 relative">
                    {hour === '10:00' && (
                      <div 
                        className="absolute inset-2 rounded-2xl p-4 flex flex-col justify-between"
                        style={{ backgroundColor: `${config.primaryColor}20`, border: `1px solid ${config.primaryColor}40` }}
                      >
                         <div>
                            <p className="text-[10px] font-black uppercase text-white tracking-widest">Consulta de Especialidad</p>
                            <p className="text-xs font-bold text-white mt-1">Dr. Roberto Valdivia</p>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] text-white/40 font-bold uppercase">Pac: Sofia Vergara</span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
