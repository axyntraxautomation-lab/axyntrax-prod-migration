import { create } from 'zustand'

export const useAxiaStore = create((set, get) => ({
  alerts: [],
  recommendations: [],
  messages: [],
  modules: [],
  
  // Operational Metrics
  metrics: {
    decisionsToday: 0,
    autoCorrections: 0,
    systemQuality: 100,
    operationalCost: 0,
  },

  addAlert: (alert) =>
    set((s) => ({
      alerts: [{ id: Date.now(), timestamp: new Date().toISOString(), ...alert }, ...s.alerts].slice(0, 50),
    })),

  addRecommendation: (rec) =>
    set((s) => ({
      recommendations: [{ id: Date.now(), timestamp: new Date().toISOString(), ...rec }, ...s.recommendations].slice(0, 20),
    })),

  addMessage: (msg) =>
    set((s) => ({
      messages: [{ id: Date.now(), timestamp: new Date().toISOString(), ...msg }, ...s.messages].slice(0, 100),
    })),

  registerModule: (mod) =>
    set((s) => ({
      modules: [...s.modules.filter((m) => m.id !== mod.id), mod],
    })),

  clearAlerts: () => set({ alerts: [] }),

  getActiveAlerts: () => get().alerts.filter((a) => !a.dismissed),

  dismissAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    })),

  updateOperationalMetrics: (newMetrics) => 
    set((s) => ({
      metrics: { ...s.metrics, ...newMetrics }
    })),

  incrementDecisions: () =>
    set((s) => ({
      metrics: { ...s.metrics, decisionsToday: s.metrics.decisionsToday + 1 }
    })),

  incrementCorrections: () =>
    set((s) => ({
      metrics: { ...s.metrics, autoCorrections: s.metrics.autoCorrections + 1 }
    })),
}))
