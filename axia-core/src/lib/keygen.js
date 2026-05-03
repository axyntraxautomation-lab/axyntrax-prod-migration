import { KEYGEN_ACCOUNT_ID, KEYGEN_DEV_MODE } from './constants'

const CACHE_KEY = 'axia_license_cache'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCachedLicense() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}

function setCachedLicense(data) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
}

export async function validateLicense(licenseKey, fingerprint) {
  // Dev mode bypass
  if (KEYGEN_DEV_MODE) {
    const devData = {
      valid: true,
      tenant: {
        id: 'dev-tenant-001',
        name: 'Antigravity Dev',
        owner: 'Miguel Montero',
        plan: 'premium',
        allowedModules: ['clinica', 'medico', 'dentista', 'logistica', 'residencial', 'veterinario', 'legal'],
      },
      license: { key: 'DEV-MODE', status: 'ACTIVE' },
    }
    setCachedLicense(devData)
    return devData
  }

  // Check cache
  const cached = getCachedLicense()
  if (cached) return cached

  // Real Keygen validation
  try {
    const res = await fetch(
      `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        body: JSON.stringify({
          meta: {
            key: licenseKey,
            scope: { fingerprint },
          },
        }),
      }
    )
    const json = await res.json()
    const result = {
      valid: json.meta?.valid === true,
      tenant: json.data?.attributes?.metadata || {},
      license: {
        key: licenseKey,
        status: json.data?.attributes?.status || 'UNKNOWN',
      },
    }
    if (result.valid) setCachedLicense(result)
    return result
  } catch (err) {
    console.error('[Keygen] Validation error:', err)
    return { valid: false, tenant: null, license: null, error: err.message }
  }
}

export function clearLicenseCache() {
  sessionStorage.removeItem(CACHE_KEY)
}
