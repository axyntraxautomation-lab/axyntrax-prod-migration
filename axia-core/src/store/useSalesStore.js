import { create } from 'zustand'
import { getRegisteredModules } from '@/lib/engine/registry'

/**
 * Sales store for Axia Configurator.
 * Tracks selected modules, calculates totals, and manages quotes.
 */
export const useSalesStore = create((set, get) => ({
  selectedModuleId: null,
  selectedSubModules: [],
  quotesRecord: [],

  selectModule: (id) => set({ 
    selectedModuleId: id,
    selectedSubModules: [] // Reset sub-modules when rubro changes
  }),

  toggleSubModule: (label) => set((s) => {
    const exists = s.selectedSubModules.includes(label)
    return {
      selectedSubModules: exists
        ? s.selectedSubModules.filter(sm => sm !== label)
        : [...s.selectedSubModules, label]
    }
  }),

  calculateTotal: () => {
    const { selectedModuleId, selectedSubModules } = get()
    const modules = getRegisteredModules()
    const config = modules.find(m => m.id === selectedModuleId)
    
    if (!config || !config.pricing) return 0
    
    const base = config.pricing.base
    const subModulesCost = selectedSubModules.length * config.pricing.perModule
    return base + subModulesCost
  },

  generateQuote: (clientName) => {
    const { selectedModuleId, selectedSubModules, calculateTotal } = get()
    const modules = getRegisteredModules()
    const config = modules.find(m => m.id === selectedModuleId)
    
    const quote = {
      id: `COT-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      clientName,
      moduleName: config?.name,
      subModules: selectedSubModules,
      total: calculateTotal()
    }

    set((s) => ({
      quotesRecord: [quote, ...s.quotesRecord]
    }))

    return quote
  }
}))
