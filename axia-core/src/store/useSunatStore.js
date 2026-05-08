import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import { RECEIPT_PREFIX, RECEIPT_SERIES } from '@/lib/constants'

export const useSunatStore = create((set, get) => ({
  receipts: [],
  nextNumber: 1,

  addReceipt: (receipt) => {
    const number = String(get().nextNumber).padStart(6, '0')
    const entry = {
      id: generateId(),
      series: RECEIPT_SERIES,
      number: `${RECEIPT_PREFIX}-${number}`,
      date: new Date().toISOString(),
      status: 'emitted',
      ...receipt,
    }
    set((s) => ({
      receipts: [entry, ...s.receipts],
      nextNumber: s.nextNumber + 1,
    }))
    return entry
  },

  getReceiptCount: () => get().receipts.length,

  getTotalBilled: () => get().receipts.reduce((sum, r) => sum + Number(r.amount), 0),

  getMonthlyBilled: () => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return get().receipts.filter((r) => r.date.startsWith(monthKey)).reduce((sum, r) => sum + Number(r.amount), 0)
  },
}))
