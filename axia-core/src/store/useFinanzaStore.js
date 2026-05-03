import { create } from 'zustand'
import { DEFAULT_FUND_SPLIT, EXPENSE_APPROVAL_THRESHOLD } from '@/lib/constants'

export const useFinanzaStore = create((set, get) => ({
  // Funds
  funds: {
    operative: 0,
    sunat: 0,
    reserve: 0,
    salary: 0,
  },
  
  // Lists
  incomes: [],
  expenses: [],
  withdrawals: [],
  
  // Config
  fundSplit: { ...DEFAULT_FUND_SPLIT },

  // Actions
  addIncome: (income) => {
    const { amount, plan, igv } = income
    const split = get().fundSplit
    const totalAmount = Number(amount)
    
    const entry = {
      id: `inc_${Date.now()}`,
      date: new Date().toISOString(),
      amount: totalAmount,
      plan,
      igv: igv || 0,
    }

    set((s) => ({
      incomes: [entry, ...s.incomes],
      funds: {
        operative: s.funds.operative + (totalAmount * split.operative),
        sunat: s.funds.sunat + (totalAmount * split.sunat),
        reserve: s.funds.reserve + (totalAmount * split.reserve),
        salary: s.funds.salary + (totalAmount * split.salary),
      }
    }))
  },

  addExpense: (expense) => {
    const amount = Number(expense.amount)
    const entry = {
      id: `exp_${Date.now()}`,
      date: new Date().toISOString(),
      status: amount > EXPENSE_APPROVAL_THRESHOLD ? 'pending' : 'approved',
      ...expense,
    }

    set((s) => ({
      expenses: [entry, ...s.expenses],
      // If approved automatically, deduct from operative
      funds: entry.status === 'approved' 
        ? { ...s.funds, operative: s.funds.operative - amount }
        : s.funds
    }))
  },

  approveExpense: (id, motive = '') => {
    const expense = get().expenses.find(e => e.id === id)
    if (!expense) return

    set((s) => ({
      expenses: s.expenses.map(e => e.id === id ? { ...e, status: 'approved', motive, approvedAt: new Date().toISOString() } : e),
      funds: { ...s.funds, operative: s.funds.operative - Number(expense.amount) }
    }))
  },

  rejectExpense: (id, motive = '') => {
    set((s) => ({
      expenses: s.expenses.map(e => e.id === id ? { ...e, status: 'rejected', motive } : e)
    }))
  },

  withdrawSalary: (amount, note = '') => {
    const val = Number(amount)
    if (get().funds.salary < val) return false

    const entry = {
      id: `wdr_${Date.now()}`,
      date: new Date().toISOString(),
      amount: val,
      note
    }

    set((s) => ({
      withdrawals: [entry, ...s.withdrawals],
      funds: { ...s.funds, salary: s.funds.salary - val }
    }))
    return true
  },

  // Helpers
  getMonthlyIncomes: () => get().incomes.reduce((sum, i) => sum + i.amount, 0),
  getPendingExpenses: () => get().expenses.filter(e => e.status === 'pending'),
}))
