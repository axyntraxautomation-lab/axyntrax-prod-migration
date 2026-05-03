import { create } from 'zustand'

export const useLeadStore = create((set, get) => ({
  leads: [],
  activeLead: null,
  newCount: 0,
  filter: { status: 'todos', bot: 'todos' },

  setLeads: (leads) => set({ 
    leads, 
    newCount: leads.filter(l => l.status === 'nuevo').length 
  }),

  setActiveLead: (lead) => set({ activeLead: lead }),

  setFilter: (filter) => set((s) => ({ filter: { ...s.filter, ...filter } })),

  addLead: (lead) => set((s) => {
    const exists = s.leads.find(l => l.id === lead.id)
    if (exists) return s
    return { 
      leads: [lead, ...s.leads], 
      newCount: s.newCount + (lead.status === 'nuevo' ? 1 : 0) 
    }
  }),

  updateLead: (id, updates) => set((s) => ({
    leads: s.leads.map(l => l.id === id ? { ...l, ...updates } : l),
    newCount: s.leads.map(l => l.id === id ? { ...l, ...updates } : l).filter(l => l.status === 'nuevo').length
  })),

  getFilteredLeads: () => {
    const { leads, filter } = get()
    return leads.filter(l => {
      const matchStatus = filter.status === 'todos' || l.status === filter.status
      const matchBot = filter.bot === 'todos' || l.bot === filter.bot
      return matchStatus && matchBot
    })
  }
}))
