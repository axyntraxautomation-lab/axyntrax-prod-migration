import { motion } from 'framer-motion'
import { MoreHorizontal, ExternalLink, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BaseTables = ({ columns = [], data = [], onAction, primaryColor = '#00CED1' }) => {
  return (
    <div className="bg-black border border-white/10 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5 text-[9px] uppercase font-black tracking-widest text-white/30">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-2">
                     {col.label}
                     {col.sortable && <ChevronDown className="w-3 h-3" />}
                   </div>
                </th>
              ))}
              <th className="px-6 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item, i) => (
              <motion.tr 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-white/5 transition-colors"
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4">
                    {col.render ? col.render(item[col.key], item) : (
                      <span className="text-xs font-bold text-white/80">{item[col.key] || '-'}</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                   <button 
                    onClick={() => onAction && onAction(item)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-all"
                   >
                     <MoreHorizontal className="w-4 h-4" />
                   </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
         <div className="p-12 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-white/20 italic">No se encontraron registros activos</p>
         </div>
      )}
    </div>
  )
}
