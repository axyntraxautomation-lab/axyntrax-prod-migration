import { create } from 'zustand'
import { getRegisteredModules } from '@/lib/engine/registry'

/**
 * Axia Business Intelligence Store
 * Calculates SaaS metrics (MRR, Churn, LTV, etc.) and tracks business events.
 */
export const useBusinessStore = create((set, get) => ({
  events: [
    { id: 'ev_1', type: 'info', message: 'Sistema de Mando AxyntraX Iniciado', date: new Date().toISOString() }
  ],
  
  // Custom baseline for CAC/Acquisition simulations
  acquisitionConfig: {
    baseCAC: 450,
    marketingSpend: 12000
  },

  /**
   * Add a business traceability event
   */
  addEvent: (message, type = 'info') => set((s) => ({
    events: [{ id: Date.now(), message, type, date: new Date().toISOString() }, ...s.events].slice(0, 50)
  })),

  /**
   * Calculate Comprehensive SaaS Metrics
   */
  getMetrics: (modulesData = {}) => {
    const modules = getRegisteredModules()
    const totalCount = modules.length
    
    // MRR Calculation (Base pricing of registered modules)
    const mrr = modules.reduce((sum, m) => sum + (m.pricing?.base || 0), 0)
    
    // Churn & Health
    const morosos = Object.values(modulesData).filter(d => d.status === 'moroso').length
    const parciales = Object.values(modulesData).filter(d => d.status === 'parcial').length
    
    const churnRate = totalCount > 0 ? (morosos / totalCount) * 100 : 0
    const ecosystemHealth = totalCount > 0 ? ((totalCount - morosos - (parciales * 0.5)) / totalCount) * 100 : 100
    
    // SaaS Ratios
    const arr = mrr * 12
    const nrr = 100 - (churnRate * 0.8) // Simulated NRR logic
    const grr = 100 - churnRate
    
    // LTV / CAC / Payback
    const avgARPU = totalCount > 0 ? mrr / totalCount : 0
    const cac = get().acquisitionConfig.baseCAC
    const ltv = churnRate > 0 ? (avgARPU / (churnRate / 100)) : (avgARPU * 24) // 24 months if 0 churn
    const payback = avgARPU > 0 ? cac / avgARPU : 0
    
    return {
      mrr,
      arr,
      churnRate,
      nrr,
      grr,
      cac,
      ltv,
      payback,
      health: ecosystemHealth
    }
  }
}))
