export const useTenantStore = create((set) => ({
  tenant: {
    id: 'axyntrax_master',
    name: 'AxyntraX Automation',
    admin: 'Miguel Montero',
    role: 'CEO',
  },
  
  // Leads from Web
  leads: [
    { id: '1', name: 'Juan Perez', plan: 'Pro', bot: 'Clinica', date: '2024-04-21', status: 'nuevo' },
    { id: '2', name: 'Maria Garcia', plan: 'Enterprise', bot: 'Legal', date: '2024-04-20', status: 'contactado' },
    { id: '3', name: 'Carlos Ruiz', plan: 'Basic', bot: 'Venta', date: '2024-04-19', status: 'demo' },
  ],

  // Financial Metrics
  metrics: {
    dailyIncome: 4500.50,
    activeClients: 124,
    sunatApartado: 810.00,
    cumulativeSalary: 12500.00,
  },

  // Funds
  funds: {
    operative: 15000.00,
    sunat: 3200.00,
    reserve: 5000.00,
    miguel: 4500.00,
  },

  // Expenses
  pendingExpenses: [
    { id: 'exp_1', concept: 'Servidor AWS', amount: 150.00, invoice: true, status: 'pending' },
    { id: 'exp_2', concept: 'API WhatsApp', amount: 85.00, invoice: true, status: 'pending' },
  ],

  // Axia Performance
  performance: {
    decisions: 1450,
    corrections: 12,
    cost: 45.30,
    alerts: 0,
    quality: 99.8,
  },

  // Actions
  updateLeadStatus: (id, status) => set((state) => ({
    leads: state.leads.map(l => l.id === id ? { ...l, status } : l)
  })),

  approveExpense: (id) => set((state) => ({
    pendingExpenses: state.pendingExpenses.map(e => e.id === id ? { ...e, status: 'approved' } : e)
  }))
})),
