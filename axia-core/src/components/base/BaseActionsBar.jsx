import { Search, Filter, Plus, FileDown, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BaseActionsBar = ({ onNew, actions = [], primaryColor = '#00CED1' }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black border border-white/5 rounded-2xl mb-8">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative group flex-1 max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors" />
           <input 
             type="text" 
             placeholder="Busqueda rapida en el modulo..."
             className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-white/20 transition-all"
           />
        </div>
        <button className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors text-white/40">
           <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
           {actions.map((act, i) => (
             <button 
               key={i}
               className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
               title={act.label}
             >
                <act.icon className="w-4 h-4" />
             </button>
           ))}
        </div>
        
        <div className="h-4 w-px bg-white/10 mx-1" />

        <button 
          onClick={onNew}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-black transition-all shadow-lg hover:scale-105 active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Registro
        </button>
      </div>
    </div>
  )
}
