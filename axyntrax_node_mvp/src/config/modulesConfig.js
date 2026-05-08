// axyntrax_node_mvp/src/config/modulesConfig.js
// ─────────────────────────────────────────────────────────
// REGISTRO CENTRAL DE MÓDULOS AXYNTRAX
// Frontend + Backend hablan el mismo idioma desde aquí.
// NO MODIFICAR IDs (son el contrato con KEYGE/Keygen.sh)
// ─────────────────────────────────────────────────────────

const MODULES = {
  medibot: {
    id: 'medibot',
    nombre: 'MediBot – Clínica Médica',
    descripcion: 'Automatización de agenda, triaje IA y recordatorios para clínicas médicas.',
    precioBase: 149,
    moneda: 'USD',
    keygeProductId: 'prod_medibot_v1',
    rutas: ['/api/medibot', '/api/clinica'],
    icono: '🏥',
    categoria: 'salud',
  },
  vetbot: {
    id: 'vetbot',
    nombre: 'VetBot – Veterinaria',
    descripcion: 'Gestión de citas, historial animal y seguimiento post-consulta.',
    precioBase: 99,
    moneda: 'USD',
    keygeProductId: 'prod_vetbot_v1',
    rutas: ['/api/vetbot', '/api/veterinario'],
    icono: '🐾',
    categoria: 'salud',
  },
  dentbot: {
    id: 'dentbot',
    nombre: 'DentBot – Odontología',
    descripcion: 'Agenda dental, recordatorios de citas y gestión de tratamientos.',
    precioBase: 119,
    moneda: 'USD',
    keygeProductId: 'prod_dentbot_v1',
    rutas: ['/api/dentbot', '/api/dentista'],
    icono: '🦷',
    categoria: 'salud',
  },
  logistica: {
    id: 'logistica',
    nombre: 'LogiBot – Logística & Delivery',
    descripcion: 'Seguimiento de envíos, gestión de rutas y notificaciones automáticas.',
    precioBase: 179,
    moneda: 'USD',
    keygeProductId: 'prod_logistica_v1',
    rutas: ['/api/logistica'],
    icono: '🚚',
    categoria: 'operaciones',
  },
  finanzas: {
    id: 'finanzas',
    nombre: 'FinBot – Finanzas & SUNAT',
    descripcion: 'Reportes financieros, control de gastos y declaraciones SUNAT automatizadas.',
    precioBase: 199,
    moneda: 'USD',
    keygeProductId: 'prod_finanzas_v1',
    rutas: ['/api/finanzas', '/api/sunat'],
    icono: '💰',
    categoria: 'finanzas',
  },
  legal: {
    id: 'legal',
    nombre: 'LegalBot – Asesoría Legal',
    descripcion: 'Gestión de contratos, alertas de vencimiento y consultas normativas IA.',
    precioBase: 159,
    moneda: 'USD',
    keygeProductId: 'prod_legal_v1',
    rutas: ['/api/legal'],
    icono: '⚖️',
    categoria: 'servicios',
  },
};

// Helper: obtener todos los IDs de rutas para un array de módulos
const getRoutesForModules = (moduleIds = []) =>
  moduleIds.flatMap((id) => MODULES[id]?.rutas ?? []);

// Helper: resolver módulo por ruta
const getModuleByRoute = (ruta) =>
  Object.values(MODULES).find((m) => m.rutas.some((r) => ruta.startsWith(r))) ?? null;

module.exports = { MODULES, getRoutesForModules, getModuleByRoute };
