import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export const useRestaurantStore = create((set, get) => ({
  tables: [
    { id: '1', label: 'Mesa 01', status: 'free', currentOrder: [] },
    { id: '2', label: 'Mesa 02', status: 'free', currentOrder: [] },
    { id: '3', label: 'Mesa 03', status: 'free', currentOrder: [] },
    { id: '4', label: 'Mesa 04', status: 'free', currentOrder: [] },
    { id: '5', label: 'Mesa 05', status: 'free', currentOrder: [] },
    { id: '6', label: 'Bar 01', status: 'free', currentOrder: [] },
    { id: '7', label: 'Bar 02', status: 'free', currentOrder: [] },
    { id: '8', label: 'Mesa 06', status: 'free', currentOrder: [] },
    { id: '9', label: 'Terraza 01', status: 'free', currentOrder: [] },
    { id: '10', label: 'Terraza 02', status: 'free', currentOrder: [] },
  ],
  menu: [
    { id: 'p1', name: 'Lomo Saltado', category: 'Platos', price: 38.00, stock: 15 },
    { id: 'p2', name: 'Ceviche Classico', category: 'Platos', price: 42.00, stock: 10 },
    { id: 'p3', name: 'Aji de Gallina', category: 'Platos', price: 32.00, stock: 20 },
    { id: 'p4', name: 'Arroz con Pollo', category: 'Platos', price: 28.00, stock: 12 },
    { id: 'b1', name: 'Chicha Morada (Jarra)', category: 'Bebidas', price: 18.00, stock: 50 },
    { id: 'b2', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, stock: 24 },
    { id: 'b3', name: 'Pisco Sour', category: 'Bebidas', price: 25.00, stock: 30 },
  ],
  sales: [],
  cashShift: {
    isOpen: false,
    openedAt: null,
    startingCash: 0,
    currentCash: 0,
    transactions: [],
  },

  openShift: (amount) => set({
    cashShift: {
      isOpen: true,
      openedAt: new Date().toISOString(),
      startingCash: Number(amount),
      currentCash: Number(amount),
      transactions: [],
    }
  }),

  closeShift: () => {
    const shift = get().cashShift
    const saleData = {
      id: generateId(),
      type: 'shift_closure',
      date: new Date().toISOString(),
      starting: shift.startingCash,
      total: shift.currentCash,
      profit: shift.currentCash - shift.startingCash,
    }
    set((s) => ({
      sales: [saleData, ...s.sales],
      cashShift: { isOpen: false, openedAt: null, startingCash: 0, currentCash: 0, transactions: [] }
    }))
    return saleData
  },

  updateTableStatus: (id, status) => set((s) => ({
    tables: s.tables.map(t => t.id === id ? { ...t, status } : t)
  })),

  addToOrder: (tableId, item) => set((s) => ({
    tables: s.tables.map(t => {
      if (t.id === tableId) {
        const existing = t.currentOrder.find(oi => oi.id === item.id)
        if (existing) {
          return {
            ...t,
            currentOrder: t.currentOrder.map(oi => oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi)
          }
        }
        return { ...t, currentOrder: [...t.currentOrder, { ...item, quantity: 1 }] }
      }
      return t
    })
  })),

  clearOrder: (tableId) => set((s) => ({
    tables: s.tables.map(t => t.id === tableId ? { ...t, currentOrder: [], status: 'free' } : t)
  })),

  processSale: (sale) => {
    const shift = get().cashShift
    set((s) => ({
      sales: [{ id: generateId(), date: new Date().toISOString(), ...sale }, ...s.sales],
      cashShift: {
        ...shift,
        currentCash: shift.currentCash + Number(sale.total),
        transactions: [...shift.transactions, { id: generateId(), ...sale, time: new Date().toISOString() }]
      }
    }))
  },

  updateStock: (items) => set((s) => ({
    menu: s.menu.map(m => {
      const orderItem = items.find(oi => oi.id === m.id)
      return orderItem ? { ...m, stock: Math.max(0, m.stock - orderItem.quantity) } : m
    })
  })),

  getCriticalStock: () => get().menu.filter(m => m.stock < 5),
  
  getOccupiedTables: () => get().tables.filter(t => t.status === 'occupied').length,
  
  getAverageTicket: () => {
    const todaySales = get().sales.filter(s => s.type !== 'shift_closure')
    if (todaySales.length === 0) return 0
    const total = todaySales.reduce((acc, s) => acc + Number(s.total), 0)
    return total / todaySales.length
  }
}))
