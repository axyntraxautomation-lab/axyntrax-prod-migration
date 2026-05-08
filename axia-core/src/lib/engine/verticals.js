import { 
  Stethoscope, Activity, Truck, Home, 
  Calendar, Users, Clipboard, Receipt, 
  Package, MapPin, ShieldCheck, CreditCard,
  MessageSquare, Box, Gavel, Dog, Zap
} from 'lucide-react'
import { registerModule } from './registry'

/**
 * Axia Vertical Engine - Registry Manifest
 */

// 1. MÉDICO PRO
registerModule('medico', {
  name: 'Medico Pro',
  sector: 'Salud / Medicina General',
  icon: Stethoscope,
  primaryColor: '#8b5cf6', // Violet
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/citas', label: 'Agenda Citas', icon: Calendar },
    { path: '/historias', label: 'Historias Clinicas', icon: Clipboard },
    { path: '/recetas', label: 'Recetario Digital', icon: Receipt },
  ],
  kpis: [
    { key: 'citas_dia', label: 'Citas Hoy', icon: Calendar, color: '#8b5cf6' },
    { key: 'pacientes_nuevos', label: 'Nuevos Pacientes', icon: Users, color: '#10b981' },
    { key: 'recaudacion', label: 'Recaudacion', icon: CreditCard, color: '#06b6d4', isCurrency: true },
  ],
  pricing: { base: 120, perModule: 30 }
})

// 2. DENTISTA AXIA
registerModule('dentista', {
  name: 'Dentista Axia',
  sector: 'Salud / Odontologia',
  icon: Activity,
  primaryColor: '#ec4899', // Pink
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/agenda', label: 'Citas Dentales', icon: Calendar },
    { path: '/presupuestos', label: 'Presupuestos', icon: Receipt },
    { path: '/odontograma', label: 'Odontograma', icon: Box },
  ],
  kpis: [
    { key: 'presupuestos_pendientes', label: 'Presupuestos', icon: Receipt, color: '#ec4899' },
    { key: 'citas_hoy', label: 'Citas Hoy', icon: Calendar, color: '#8b5cf6' },
    { key: 'ingresos_mes', label: 'Ingresos Mes', icon: CreditCard, color: '#10b981', isCurrency: true },
  ],
  pricing: { base: 150, perModule: 40 }
})

// 2. LOGITRACK
registerModule('logistica', {
  name: 'LogiTrack',
  sector: 'Logistica / Transporte',
  icon: Truck,
  primaryColor: '#06b6d4', // Cyan
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/flota', label: 'Gestion de Flota', icon: Truck },
    { path: '/despachos', label: 'Guias & Despachos', icon: MapPin },
    { path: '/almacen', label: 'Almacen SKU', icon: Package },
  ],
  kpis: [
    { key: 'entregas_hoy', label: 'Entregas Hoy', icon: MapPin, color: '#06b6d4' },
    { key: 'vehiculos_activos', label: 'Flota Activa', icon: Truck, color: '#8b5cf6' },
    { key: 'stock_critico', label: 'Stock Alerta', icon: Package, color: '#f59e0b' },
  ],
  pricing: { base: 200, perModule: 50 }
})

// 3. AXIA RESIDENCIAL
registerModule('residencial', {
  name: 'Axia Residencial',
  sector: 'Administracion de Inmuebles',
  icon: Home,
  primaryColor: '#10b981', // Emerald
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/condominios', label: 'Condominios', icon: Home },
    { path: '/cobranzas', label: 'Cobranzas', icon: CreditCard },
    { path: '/reservas', label: 'Areas Comunes', icon: Calendar },
    { path: '/incidencias', label: 'Incidencias', icon: MessageSquare },
  ],
  kpis: [
    { key: 'mora_promedio', label: 'Mora Promedio', icon: CreditCard, color: '#ef4444', isCurrency: true },
    { key: 'unidades_alquiladas', label: 'Unidades', icon: Home, color: '#10b981' },
    { key: 'tickets_abiertos', label: 'Incidencias', icon: MessageSquare, color: '#f59e0b' },
  ],
  pricing: { base: 250, perModule: 60 }
})

// 4. VETERINARIO
registerModule('veterinario', {
  name: 'Axia Vet',
  sector: 'Salud Animal / Veterinaria',
  icon: Dog,
  primaryColor: '#f59e0b', // Amber
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/pacientes', label: 'Mascotas', icon: Users },
    { path: '/estetica', label: 'Estetica', icon: Zap },
    { path: '/vacunas', label: 'Vacunas', icon: ShieldCheck },
  ],
  kpis: [
    { key: 'pacientes_dia', label: 'Mascotas Hoy', icon: Users, color: '#f59e0b' },
    { key: 'proxima_vacuna', label: 'Vacunas Pend.', icon: ShieldCheck, color: '#10b981' },
    { key: 'ventas_petshop', label: 'PetShop', icon: CreditCard, color: '#8b5cf6', isCurrency: true },
  ],
  pricing: { base: 130, perModule: 35 }
})

// 5. LEGAL PRO
registerModule('legal', {
  name: 'Axia Legal',
  sector: 'Servicios Juridicos',
  icon: Gavel,
  primaryColor: '#ef4444', // Red
  sections: [
    { path: '', label: 'Dashboard', icon: Activity },
    { path: '/expedientes', label: 'Expedientes', icon: Clipboard },
    { path: '/audiencias', label: 'Audiencias', icon: Calendar },
    { path: '/factura-legal', label: 'Honorarios', icon: Receipt },
  ],
  kpis: [
    { key: 'casos_activos', label: 'Expedientes', icon: Clipboard, color: '#ef4444' },
    { key: 'audiencias_hoy', label: 'Audiencias', icon: Calendar, color: '#f59e0b' },
    { key: 'cobros_pendientes', label: 'Cobrar', icon: CreditCard, color: '#10b981', isCurrency: true },
  ],
  pricing: { base: 300, perModule: 80 }
})
