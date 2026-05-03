/**
 * Axia Module Engine Registry
 * Centralizes all vertical module configurations.
 */

const registry = {}

/**
 * Register a new vertical module into the Axia Engine.
 * @param {string} id Unique identifier for the module (e.g., 'restaurante', 'clinica')
 * @param {Object} config Configuration object following the BaseModule template
 */
export function registerModule(id, config) {
  registry[id] = {
    id,
    path: `/module/${id}`,
    ...config,
  }
  console.log(`[Axia Engine] Module registered: ${id}`)
}

/**
 * Retrieve all registered modules.
 */
export function getRegisteredModules() {
  return Object.values(registry)
}

/**
 * Retrieve a specific module configuration.
 */
export function getModuleConfig(id) {
  return registry[id] || null
}

/**
 * Standard colors for modules
 */
export const MODULE_COLORS = {
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#e11d48',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
}
