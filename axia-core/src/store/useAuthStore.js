import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isLoading: true,
  tenant: null,
  license: null,
  fingerprint: null,
  error: null,

  setAuthenticated: (data) =>
    set({
      isAuthenticated: true,
      isLoading: false,
      tenant: data.tenant,
      license: data.license,
      fingerprint: data.fingerprint,
      error: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) =>
    set({ isAuthenticated: false, isLoading: false, error }),

  logout: () =>
    set({
      isAuthenticated: false,
      tenant: null,
      license: null,
      fingerprint: null,
      error: null,
    }),

  // Permission Selectors
  hasModule: (moduleId) => {
    const state = useAuthStore.getState()
    if (!state.tenant?.allowedModules) return false
    return state.tenant.allowedModules.includes(moduleId)
  },

  isPremium: () => {
    const state = useAuthStore.getState()
    return state.tenant?.plan === 'premium'
  }
}))
