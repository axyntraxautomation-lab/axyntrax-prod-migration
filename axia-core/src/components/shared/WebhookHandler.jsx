import { useEffect } from 'react'
import { useLeadStore } from '@/store/useLeadStore'
import { LeadSyncService } from '@/lib/services/LeadSyncService'

/**
 * WebhookHandler
 * Componente silencioso que escucha eventos de la web y actualiza el LeadStore.
 * En producción esto usaría WebSockets; para esta fase usamos polling ligero.
 */
export const WebhookHandler = () => {
  const { addLead } = useLeadStore()

  useEffect(() => {
    // Polling cada 30 segundos para nuevos leads
    const interval = setInterval(async () => {
      try {
        const data = await LeadSyncService.fetchLeads()
        // Suponiendo que la API devuelve los leads más recientes
        data.forEach(lead => addLead(lead))
      } catch (error) {
        console.error('Error sincronizando leads:', error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [addLead])

  return null // Componente sin UI
}
