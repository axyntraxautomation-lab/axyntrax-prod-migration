import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import { DEFAULT_FUND_SPLIT } from '@/lib/constants'

export const useFinanceStore = create((set, get) => ({
  incomes: [],
  funds: {
    operative: 0,
    sunat: 0,
    reserve: 0,
    salary: 0,
  },
  fundSplit: { ...DEFAULT_FUND_SPLIT },

  addIncome: (income) => {
    const entry = { id: generateId(), date: new Date().toISOString(), ...income }
    const split = get().fundSplit
    const amount = Number(income.amount)

    set((s) => ({
      incomes: [entry, ...s.incomes],
      funds: {
        operative: s.funds.operative + amount * split.operative,
        sunat: s.funds.sunat + amount * split.sunat,
        reserve: s.funds.reserve + amount * split.reserve,
        salary: s.funds.salary + amount * split.salary,
      },
    }))
  },

  updateFundSplit: (newSplit) => set({ fundSplit: newSplit }),

  getTotalIncome: () => get().incomes.reduce((sum, i) => sum + Number(i.amount), 0),

  getTodayIncome: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().incomes.filter((i) => i.date.startsWith(today)).reduce((sum, i) => sum + Number(i.amount), 0)
  },

  deductFromFund: (fundName, amount) => {
    set((s) => ({
      funds: { ...s.funds, [fundName]: Math.max(0, s.funds[fundName] - Number(amount)) },
    }))
  },

  recordModuleTransaction: (moduleId, amount, concept) => {
    get().addIncome({
      amount,
      service: `Axia ${moduleId.toUpperCase()}`,
      concept: concept || 'Venta de Servicio',
      moduleId
    })
  }
}))
