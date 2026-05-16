export const MODULES = [
  { 
    id: "MED", label: "Médico / Clínica", price: 299,
    desc: "Gestión completa para consultorios y clínicas.",
    free: ["Agenda de citas inteligente", "Recordatorios por WhatsApp", "Historial clínico básico"],
    extras: [
      { name: "Telemedicina integrada", price: 99 },
      { name: "Recetas electrónicas digitales", price: 49 },
      { name: "Integración con laboratorio", price: 149 }
    ]
  },
  { 
    id: "VET", label: "Veterinaria", price: 249,
    desc: "Control de pacientes peludos y stock de farmacia.",
    free: ["Citas y peluquería", "Carnet de vacunas digital", "Recordatorio de desparasitación"],
    extras: [
      { name: "Punto de venta (Petshop)", price: 89 },
      { name: "Consentimientos informados", price: 39 },
      { name: "Alertas de hospitalización", price: 119 }
    ]
  },
  { 
    id: "LEX", label: "Legal / Estudio", price: 349,
    desc: "Organización de expedientes y relación con clientes.",
    free: ["Consulta inicial automatizada", "Gestión de citas y audiencias", "CRM de casos activo"],
    extras: [
      { name: "Generador de contratos IA", price: 159 },
      { name: "Alertas de plazos de ley", price: 79 },
      { name: "Facturación electrónica legal", price: 89 }
    ]
  },
  { 
    id: "WASH", label: "Car Wash", price: 199,
    desc: "Reservas ágiles y control de flujo de vehículos.",
    free: ["Reservas por WhatsApp", "Avisos de vehículo listo", "Control básico de ingresos"],
    extras: [
      { name: "Membresías recurrentes", price: 69 },
      { name: "Control de insumos (Kardex)", price: 59 },
      { name: "Comisión de operarios", price: 49 }
    ]
  },
  { 
    id: "ABAS", label: "Abastos / Market", price: 299,
    desc: "Punto de venta rápido y control de inventario preciso.",
    free: ["POS Web ultrarrápido", "Catálogo por WhatsApp", "Control de caja diario"],
    extras: [
      { name: "Kardex avanzado multi-almacén", price: 129 },
      { name: "Alertas de stock mínimo", price: 49 },
      { name: "Integración de balanzas", price: 89 }
    ]
  },
  { 
    id: "LICO", label: "Licorería", price: 249,
    desc: "Delivery nocturno y promociones automatizadas.",
    free: ["Catálogo digital 24/7", "Pedidos al instante", "Control de stock en tiempo real"],
    extras: [
      { name: "Ruteo de delivery en mapa", price: 79 },
      { name: "Promociones por hora (Happy Hour)", price: 39 },
      { name: "Programa de lealtad", price: 59 }
    ]
  },
  { 
    id: "BARBER", label: "Barbería / Salón", price: 199,
    desc: "Agenda perfecta y comisiones claras para tu equipo.",
    free: ["Reservas con elección de barbero", "Recordatorios anti-ausencias", "Perfil de cliente"],
    extras: [
      { name: "Pago de comisiones automático", price: 69 },
      { name: "Venta de productos (Pomadas, etc)", price: 49 },
      { name: "Suscripción de cortes mensuales", price: 59 }
    ]
  },
  { 
    id: "REST", label: "Restaurant", price: 299,
    desc: "Atención ágil en mesa y motor de delivery propio.",
    free: ["Carta QR interactiva", "Toma de pedidos en WhatsApp", "Gestión de mesas básica"],
    extras: [
      { name: "Monitor de cocina (KDS)", price: 119 },
      { name: "Integración motor delivery", price: 89 },
      { name: "Facturación dividida", price: 49 }
    ]
  },
  { 
    id: "FERR", label: "Ferretería", price: 349,
    desc: "Catálogos inmensos y facturación por volumen.",
    free: ["Buscador rápido de productos", "Cotizaciones automáticas PDF", "Facturación B2B básica"],
    extras: [
      { name: "Lector de código de barras", price: 89 },
      { name: "Cuentas por cobrar", price: 129 },
      { name: "Lista de precios dinámicos", price: 99 }
    ]
  },
  { 
    id: "CONTA", label: "Contabilidad", price: 399,
    desc: "Para estudios contables que manejan múltiples RUCs.",
    free: ["Recepción de comprobantes XML", "Calendario de vencimientos SUNAT", "Directorio de clientes"],
    extras: [
      { name: "Cálculo de planillas básico", price: 149 },
      { name: "Generación de libros electrónicos", price: 199 },
      { name: "Alertas a clientes por WhatsApp", price: 89 }
    ]
  },
  { 
    id: "RESI", label: "Residencial / Condominio", price: 299,
    desc: "Gestión de pagos y comunicación vecinal eficiente.",
    free: ["Avisos de cobro por WhatsApp", "Registro de visitas", "Directorio de propietarios"],
    extras: [
      { name: "Conciliación bancaria automática", price: 129 },
      { name: "Reservas de áreas comunes", price: 59 },
      { name: "Votaciones y asambleas online", price: 79 }
    ]
  },
  { 
    id: "MEC", label: "Mecánica / Taller", price: 249,
    desc: "Seguimiento de reparaciones y presupuestos claros.",
    free: ["Recepción vehicular y fotos", "Envío de presupuesto por WA", "Historial de reparaciones"],
    extras: [
      { name: "Aprobación de servicios digital", price: 69 },
      { name: "Control de repuestos", price: 99 },
      { name: "Recordatorio de mantenimientos", price: 59 }
    ]
  },
  { 
    id: "MARK", label: "Marketing / Redes", price: 399,
    desc: "Director de marketing autónomo (Agente MARK).",
    free: ["Publicaciones programadas FB/IG", "Generación de contenido con IA", "Reporte de alcance Atlas"],
    extras: [
      { name: "Automatización LinkedIn B2B", price: 199 },
      { name: "Análisis de sentimientos IA", price: 129 },
      { name: "Publicidad Meta Ads gestionada", price: 299 }
    ]
  }
];
