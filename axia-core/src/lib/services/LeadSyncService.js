/**
 * LeadSyncService.js
 * Servicio para la sincronización de leads entre el Web Portal y el Dashboard.
 */

const API_URL = import.meta.env.VITE_API_WEB_URL || 'https://axyntrax-automation.netlify.app/api'

export const LeadSyncService = {
  /**
   * Obtiene todos los leads desde la base de datos centralizada.
   */
  async fetchLeads() {
    const response = await fetch(`${API_URL}/leads`)
    if (!response.ok) throw new Error('Error al obtener leads')
    return response.json()
  },

  /**
   * Crea un nuevo lead (generalmente llamado desde el WebhookHandler).
   */
  async createLead(leadData) {
    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...leadData,
        date: new Date().toISOString(),
        status: 'nuevo'
      })
    })
    return response.json()
  },

  /**
   * Actualiza el estado de un lead (ej. nuevo -> contactado).
   */
  async updateStatus(id, status) {
    const response = await fetch(`${API_URL}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    return response.json()
  },

  /**
   * Activa el acceso al sistema para un lead cerrado/demo.
   */
  async activateAccess(id) {
    const response = await fetch(`${API_URL}/leads/${id}/activate`, {
      method: 'POST'
    })
    return response.json()
  }
}
