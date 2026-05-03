import { 
  Stethoscope, Truck, Home, Gavel, Dog, Activity,
  Users, Calendar, Clipboard, Receipt, Package, 
  MapPin, ShieldCheck, CreditCard, MessageSquare, Box, Zap
} from 'lucide-react'

/**
 * Static Module Definitions (Reference only)
 * The system now primarily uses the dynamic Registry.
 */
export const MODULE_CONFIG = {
  medico: {
    name: 'Medico Pro',
    sector: 'Salud / Medicina General',
    icon: Stethoscope,
    primaryColor: '#8b5cf6',
    sections: [
      { path: '', label: 'Dashboard', icon: Activity },
      { path: '/citas', label: 'Citas', icon: Calendar },
      { path: '/pacientes', label: 'Pacientes', icon: Users },
      { path: '/historias', label: 'Historias', icon: Clipboard },
    ],
    kpis: [
      { key: 'citas_hoy', label: 'Citas Hoy', icon: Calendar, color: '#8b5cf6' },
      { key: 'pacientes_nuevos', label: 'Nuevos', icon: Users, color: '#10b981' },
      { key: 'ingresos', label: 'Ingresos', icon: CreditCard, color: '#06b6d4', isCurrency: true },
    ]
  },
  veterinario: {
    name: 'VetBot',
    sector: 'Salud Animal',
    icon: Dog,
    primaryColor: '#f59e0b',
    sections: [
      { path: '', label: 'Dashboard', icon: Activity },
      { path: '/mascotas', label: 'Mascotas', icon: Dog },
      { path: '/vacunas', label: 'Vacunas', icon: ShieldCheck },
      { path: '/ventas', label: 'Ventas', icon: Receipt },
    ],
    kpis: [
      { key: 'pacientes_dia', label: 'Mascotas Hoy', icon: Dog, color: '#f59e0b' },
      { key: 'vacunas_pend', label: 'Vacunas', icon: ShieldCheck, color: '#10b981' },
    ]
  },
  dentista: {
    name: 'Dentista Axia',
    sector: 'Odontología',
    icon: Activity,
    primaryColor: '#ec4899',
    sections: [
      { path: '', label: 'Dashboard', icon: Activity },
      { path: '/odontograma', label: 'Odontograma', icon: Box },
      { path: '/presupuestos', label: 'Presupuestos', icon: CreditCard },
    ],
    kpis: [
      { key: 'presupuestos_pend', label: 'Presupuestos', icon: CreditCard, color: '#ec4899' },
    ]
  },
  legal: {
    name: 'Axia Legal',
    sector: 'Legal',
    icon: Gavel,
    primaryColor: '#ef4444',
    sections: [
      { path: '', label: 'Dashboard', icon: Activity },
      { path: '/expedientes', label: 'Expedientes', icon: Clipboard },
      { path: '/audiencias', label: 'Audiencias', icon: Calendar },
    ],
    kpis: [
      { key: 'casos_activos', label: 'Expedientes', icon: Clipboard, color: '#ef4444' },
    ]
  },
  logistica: {
    name: 'LogiTrack',
    sector: 'Logística',
    icon: Truck,
    primaryColor: '#06b6d4',
    sections: [
      { path: '', label: 'Dashboard', icon: Activity },
      { path: '/flota', label: 'Flota', icon: Truck },
      { path: '/entregas', label: 'Entregas', icon: MapPin },
    ],
    kpis: [
      { key: 'envios_dia', label: 'Envios Hoy', icon: MapPin, color: '#06b6d4' },
    ]
  },
  residencial: {
    name: 'Axia Residencial',
    sector: 'Condominios',
    icon: Home,
    primaryColor: '#10b981',
    sections: [
      { path: '', label: 'Dashboard', icon: Activity },
      { path: '/unidades', label: 'Unidades', icon: Home },
      { path: '/cuotas', label: 'Cuotas', icon: Receipt },
    ],
    kpis: [
      { key: 'mora', label: 'Mora', icon: CreditCard, color: '#ef4444' },
    ]
  }
}
