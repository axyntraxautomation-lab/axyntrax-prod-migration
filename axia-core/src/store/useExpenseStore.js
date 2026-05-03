import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import { EXPENSE_APPROVAL_THRESHOLD } from '@/lib/constants'

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  approvalQueue: [],

  addExpense: (expense) => {
    const entry = {
      id: generateId(),
      date: new Date().toISOString(),
      status: Number(expense.amount) > EXPENSE_APPROVAL_THRESHOLD ? 'pending_approval' : 'approved',
      ...expense,
    }

    if (entry.status === 'pending_approval') {
      set((s) => ({ approvalQueue: [entry, ...s.approvalQueue] }))
    } else {
      set((s) => ({ expenses: [entry, ...s.expenses] }))
    }
  },

  approveExpense: (id) => {
    const item = get().approvalQueue.find((e) => e.id === id)
    if (!item) return
    set((s) => ({
      approvalQueue: s.approvalQueue.filter((e) => e.id !== id),
      expenses: [{ ...item, status: 'approved', approvedAt: new Date().toISOString() }, ...s.expenses],
    }))
  },

  rejectExpense: (id) => {
    set((s) => ({
      approvalQueue: s.approvalQueue.filter((e) => e.id !== id),
      expenses: [
        { ...s.approvalQueue.find((e) => e.id === id), status: 'rejected', rejectedAt: new Date().toISOString() },
        ...s.expenses,
      ],
    }))
  },

  getTotalExpenses: () => get().expenses.filter((e) => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0),

  getTodayExpenses: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().expenses.filter((e) => e.status === 'approved' && e.date.startsWith(today)).reduce((sum, e) => sum + Number(e.amount), 0)
  },

  getPendingCount: () => get().approvalQueue.length,
}))
