import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export const useSalaryStore = create((set, get) => ({
  withdrawals: [],

  addWithdrawal: (amount, note = '') => {
    const entry = {
      id: generateId(),
      amount: Number(amount),
      date: new Date().toISOString(),
      note,
    }
    set((s) => ({ withdrawals: [entry, ...s.withdrawals] }))
    return entry
  },

  getTotalWithdrawn: () => get().withdrawals.reduce((sum, w) => sum + w.amount, 0),

  getMonthlyWithdrawn: () => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return get().withdrawals.filter((w) => w.date.startsWith(monthKey)).reduce((sum, w) => sum + w.amount, 0)
  },
}))
