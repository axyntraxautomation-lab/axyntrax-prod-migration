import { Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Common Filter toggle and drawer for modules.
 * Standardizes how users refine data across different verticals.
 */
export default function BaseFilters({ options = [], activeFilters = {}, onFilterChange, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="p-2 rounded-lg bg-surface-2 border border-border text-text-dim">
        <Filter className="w-4 h-4" />
      </div>
      
      {options.map((opt) => (
        <select
          key={opt.key}
          value={activeFilters[opt.key] || ''}
          onChange={(e) => onFilterChange(opt.key, e.target.value)}
          className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-text-muted focus:outline-none focus:border-accent"
        >
          <option value="">{opt.label}: Todos</option>
          {opt.values.map(val => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
      ))}

      {Object.keys(activeFilters).length > 0 && (
        <button 
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-[10px] font-black uppercase tracking-widest border border-danger/20 hover:bg-danger/20 transition-all"
        >
          Limpiar
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
