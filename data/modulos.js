export const modulos = [
  {
    id: 'clinicas',
    nombre: 'Clínicas y Centros Médicos',
    icono: '🏥',
    color: '#ec4899',
    subModulos: {
      A: { nombre: 'Agenda Inteligente', descripcion: 'Citas automáticas, recordatorios WhatsApp/SMS' },
      B: { nombre: 'Triaje IA', descripcion: 'Clasificación de pacientes, historial clínico básico' },
      C: { nombre: 'Gestión Completa', descripcion: 'Expedientes digitales, recetas, facturación, telemedicina' }
    },
    precios: {
      bronce: 129,
      plata: 229,
      oro: 359
    }
  },
  {
    id: 'odontologia',
    nombre: 'Odontología',
    icono: '🦷',
    color: '#3b82f6',
    subModulos: {
      A: { nombre: 'Agenda Dental', descripcion: 'Turnos automáticos, recordatorios y confirmaciones' },
      B: { nombre: 'Odontograma Digital', descripcion: 'Historial, fotos clínicas, plan de tratamiento' },
      C: { nombre: 'Seguimiento Post-Tratamiento', descripcion: 'Alertas de control, cobros, laboratorio' }
    },
    precios: {
      bronce: 99,
      plata: 189,
      oro: 299
    }
  },
  {
    id: 'logistica',
    nombre: 'Logística y Transportes',
    icono: '🚚',
    color: '#f59e0b',
    subModulos: {
      A: { nombre: 'Control de Flotas', descripcion: 'GPS tiempo real, estados de despacho' },
      B: { nombre: 'Atención al Cliente IA', descripcion: 'Rastreo WhatsApp, reclamos, chatbot' },
      C: { nombre: 'Operaciones Avanzadas', descripcion: 'Rutas optimizadas IA, facturación, reportes' }
    },
    precios: {
      bronce: 149,
      plata: 269,
      oro: 429
    }
  },
  {
    id: 'veterinarias',
    nombre: 'Veterinarias',
    icono: '🐾',
    color: '#10b981',
    subModulos: {
      A: { nombre: 'Agendamiento Servicios', descripcion: 'Baño, corte, consultas, recordatorios' },
      B: { nombre: 'Carnet de Vacunación Digital', descripcion: 'Historial médico, alertas de vacunas' },
      C: { nombre: 'Inventario Pet Shop', descripcion: 'Stock, ventas IA, combos, caja integrada' }
    },
    precios: {
      bronce: 89,
      plata: 169,
      oro: 279
    }
  },
  {
    id: 'retail',
    nombre: 'Retail y Comercio',
    icono: '🛒',
    color: '#8b5cf6',
    subModulos: {
      A: { nombre: 'POS y Control de Caja', descripcion: 'Punto de venta, cierre automático, reportes' },
      B: { nombre: 'Pagos Yape/Plin/Tarjetas', descripcion: 'Multi-pago, conciliación, comprobantes' },
      C: { nombre: 'Soporte de Ventas IA', descripcion: 'Predicción de demanda, stock, fidelización' }
    },
    precios: {
      bronce: 119,
      plata: 219,
      oro: 349
    }
  },
  {
    id: 'legal',
    nombre: 'Sector Legal',
    icono: '⚖️',
    color: '#ef4444',
    subModulos: {
      A: { nombre: 'Filtro de Consultas IA', descripcion: 'Clasificación, agenda, pre-screening' },
      B: { nombre: 'Agendamiento y Cobro', descripcion: 'Citas, honorarios automatizados, recordatorios' },
      C: { nombre: 'Gestor de Expedientes', descripcion: 'Expedientes digitales, vencimientos, búsqueda IA' }
    },
    precios: {
      bronce: 139,
      plata: 249,
      oro: 399
    }
  },
  {
    id: 'carwash',
    nombre: 'Car Wash',
    icono: '🚗',
    color: '#06b6d4',
    isNew: true,
    subModulos: {
      A: { nombre: 'Gestión de Turnos', descripcion: 'Cola digital, agendamiento, notificaciones' },
      B: { nombre: 'Seguimiento en Tiempo Real', descripcion: 'Estado del vehículo QR/WhatsApp, historial' },
      C: { nombre: 'Fidelización y Paquetes', descripcion: 'Membresías, puntos, combos, caja, reportes IA' }
    },
    precios: {
      bronce: 89,
      plata: 169,
      oro: 269
    }
  }
];
