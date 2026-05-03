export const APP_NAME = 'AxyntraX Automation'
export const APP_VERSION = '1.0.0'
export const OWNER_NAME = 'Miguel Montero'
export const COUNTRY = 'PE'
export const CURRENCY = 'PEN'
export const CURRENCY_SYMBOL = 'S/.'

// Fund allocation defaults (configurable)
export const DEFAULT_FUND_SPLIT = {
  operative: 0.60,
  sunat: 0.10,
  reserve: 0.20,
  salary: 0.10,
}

// Expense approval threshold
export const EXPENSE_APPROVAL_THRESHOLD = 500

// Keygen
export const KEYGEN_ACCOUNT_ID = import.meta.env.VITE_KEYGEN_ACCOUNT_ID || ''
export const KEYGEN_DEV_MODE = true // FORCED FOR UAT CERTIFICATION

// Receipt numbering
export const RECEIPT_PREFIX = 'RH'
export const RECEIPT_SERIES = 'E001'

// Report periods
export const REPORT_PERIODS = ['daily', 'weekly', 'monthly']

// API Configuration
const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// Railway Backend (Flask/Python)
export const BACKEND_URL = IS_LOCAL 
  ? 'http://localhost:5001' 
  : 'https://satisfied-alignment-production-0eeb.up.railway.app'

// Vercel Internal API (Serverless Functions)
export const INTERNAL_API_URL = IS_LOCAL ? 'http://localhost:5173' : '' 
