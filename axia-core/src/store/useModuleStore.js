import { create } from 'zustand'

/**
 * Dynamic Module Store
 * Manages state for all vertical modules using a keyed approach.
 * Each module ID gets its own namespace within the store.
 */
export const useModuleStore = create((set, get) => ({
  // dynamic state indexed by moduleId
  modulesData: {},

  /**
   * Initialize or update data for a specific module
   */
  setModuleData: (moduleId, data) => set((s) => ({
    modulesData: {
      ...s.modulesData,
      [moduleId]: {
        ...(s.modulesData[moduleId] || {}),
        ...data
      }
    }
  })),

  /**
   * Get data for a specific module
   */
  getModuleData: (moduleId) => get().modulesData[moduleId] || { status: 'nuevo' },

  /**
   * Set status for a specific module
   */
  setModuleStatus: (moduleId, status) => set((s) => ({
    modulesData: {
      ...s.modulesData,
      [moduleId]: {
        ...(s.modulesData[moduleId] || {}),
        status
      }
    }
  })),

  /**
   * Universal record action (e.g., adding an appointment, a sale, etc.)
   */
  addModuleRecord: (moduleId, collectionName, record) => {
    const currentData = get().getModuleData(moduleId)
    const collection = currentData[collectionName] || []
    
    set((s) => ({
      modulesData: {
        ...s.modulesData,
        [moduleId]: {
          ...currentData,
          [collectionName]: [{ id: Date.now(), timestamp: new Date().toISOString(), ...record }, ...collection]
        }
      }
    }))
  }
}))
