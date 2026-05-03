import FingerprintJS from '@fingerprintjs/fingerprintjs'

let cachedFingerprint = null

export async function getFingerprint() {
  if (cachedFingerprint) return cachedFingerprint
  const fp = await FingerprintJS.load()
  const result = await fp.get()
  cachedFingerprint = result.visitorId
  return cachedFingerprint
}

// Basic anti-tampering checks
export function initAntiHack() {
  // Detect DevTools (basic)
  const threshold = 160
  const check = () => {
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      document.title = 'Axia'
    }
  }
  setInterval(check, 2000)

  // Prevent right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  // Prevent common key shortcuts for source access in production
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U') ||
        e.key === 'F12'
      ) {
        e.preventDefault()
      }
    })
  }
}
