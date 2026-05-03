import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CURRENCY_SYMBOL } from './constants'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return `${CURRENCY_SYMBOL} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date, fmt = 'dd/MM/yyyy') {
  if (!date) return '-'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return fmt.replace('dd', day).replace('MM', month).replace('yyyy', year)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function truncate(str, len = 40) {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

export function percentOf(value, total) {
  if (!total) return 0
  return ((value / total) * 100).toFixed(1)
}
