import { Stethoscope, Users, Calendar, Clipboard, Activity } from 'lucide-react'
import { registerModule } from '@/lib/engine/registry'

/**
 * Example Vertical Module Configuration: Clinica
 * demonstrating how the Axia Engine handles vertical scaling.
 */

export const CLINICA_CONFIG = {
  name: 'Clinica Axia',
  sector: 'Salud / Consultorios',
  icon: Stethoscope,
  primaryColor: '#8b5cf6', // Violet
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/agenda', label: 'Agenda Citas', icon: Calendar },
    { path: '/pacientes', label: 'Pacientes', icon: Users },
    { path: '/historias', label: 'Historias Medicas', icon: Clipboard },
  ],
  kpis: [
    { key: 'citas_hoy', label: 'Citas Hoy', icon: Calendar, color: '#8b5cf6' },
    { key: 'nuevos_pacientes', label: 'Nuevos Pacientes', icon: Users, color: '#10b981' },
    { key: 'recaudacion_dia', label: 'Recaudacion', icon: Activity, color: '#06b6d4', isCurrency: true },
    { key: 'atencion_promedio', label: 'Minutos Atencion', icon: Clipboard, color: '#f59e0b', subtext: 'Promedio por cita' },
  ],
  axiaRecommendations: [
    { type: 'Eficiencia', text: 'El consultorio B tiene un tiempo muerto de 25% los Martes. Sugiero abrir citas de telemedicina.' },
    { type: 'Retencion', text: '5 pacientes cronicos no han agendado control este mes. Generar alerta de seguimiento.' }
  ]
}

// Auto-register when imported
registerModule('clinica', CLINICA_CONFIG)
