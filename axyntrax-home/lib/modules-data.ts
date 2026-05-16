export const MODULES = [
  { 
    id: "BARBER", label: "Barbería / Salón", 
    desc: "Control de citas y comisiones para estilistas.",
    submodules: [
      { id: "B1", name: "Agenda Inteligente", type: "FREE" },
      { id: "B2", name: "Perfil de Cliente", type: "FREE" },
      { id: "B3", name: "Recordatorios WhatsApp", type: "FREE" },
      { id: "B4", name: "Cálculo de Comisiones", type: "PAID", price: 49 },
      { id: "B5", name: "Punto de Venta POS", type: "PAID", price: 69 },
      { id: "B6", name: "Control de Insumos", type: "PAID", price: 39 },
      { id: "B7", name: "Programa de Fidelización", type: "PAID", price: 59 }
    ]
  },
  { 
    id: "DENT", label: "Dentista / Odontología", 
    desc: "Historias clínicas y gestión de pacientes dentales.",
    submodules: [
      { id: "D1", name: "Ficha del Paciente", type: "FREE" },
      { id: "D2", name: "Calendario de Citas", type: "FREE" },
      { id: "D3", name: "Odontograma Básico", type: "FREE" },
      { id: "D4", name: "Rayos X Digitales", type: "PAID", price: 89 },
      { id: "D5", name: "Laboratorio Dental", type: "PAID", price: 119 },
      { id: "D6", name: "Control Financiero", type: "PAID", price: 79 },
      { id: "D7", name: "Recetario Electrónico", type: "PAID", price: 39 }
    ]
  },
  { 
    id: "LEX", label: "Legal / Estudio Jurídico", 
    desc: "Gestión de expedientes y CRM legal.",
    submodules: [
      { id: "L1", name: "Control de Expedientes", type: "FREE" },
      { id: "L2", name: "Agenda de Audiencias", type: "FREE" },
      { id: "L3", name: "Plantillas de Documentos", type: "FREE" },
      { id: "L4", name: "Facturación Legal", type: "PAID", price: 89 },
      { id: "L5", name: "Contratos con IA", type: "PAID", price: 159 },
      { id: "L6", name: "Alertas Plazos de Ley", type: "PAID", price: 79 },
      { id: "L7", name: "CRM de Clientes", type: "PAID", price: 99 }
    ]
  },
  { 
    id: "CONTA", label: "Contable / Auditoría", 
    desc: "Manejo de múltiples RUCs y cumplimiento SUNAT.",
    submodules: [
      { id: "C1", name: "Directorio de RUCs", type: "FREE" },
      { id: "C2", name: "Alertas de Vencimiento", type: "FREE" },
      { id: "C3", name: "Receptor de XMLs", type: "FREE" },
      { id: "C4", name: "Libros Electrónicos", type: "PAID", price: 199 },
      { id: "C5", name: "Cálculo de Planillas", type: "PAID", price: 149 },
      { id: "C6", name: "Auditoría de Compras", type: "PAID", price: 89 },
      { id: "C7", name: "Asesor Contable WA", type: "PAID", price: 99 }
    ]
  },
  { 
    id: "VET", label: "Clínica Veterinaria", 
    desc: "Historias clínicas veterinarias y petshop.",
    submodules: [
      { id: "V1", name: "Historia Clínica Vet", type: "FREE" },
      { id: "V2", name: "Agenda de Vacunas", type: "FREE" },
      { id: "V3", name: "Citas Médicas", type: "FREE" },
      { id: "V4", name: "Módulo Hospitalización", type: "PAID", price: 119 },
      { id: "V5", name: "Control de Cirugías", type: "PAID", price: 89 },
      { id: "V6", name: "Inventario Petshop", type: "PAID", price: 69 },
      { id: "V7", name: "Baños y Peluquería", type: "PAID", price: 49 }
    ]
  },
  { 
    id: "LICO", label: "Licorería / Market", 
    desc: "Venta de licores y delivery nocturno.",
    submodules: [
      { id: "LI1", name: "Catálogo WhatsApp", type: "FREE" },
      { id: "LI2", name: "Toma de Pedidos", type: "FREE" },
      { id: "LI3", name: "Caja Diaria", type: "FREE" },
      { id: "LI4", name: "Ruteo de Delivery", type: "PAID", price: 79 },
      { id: "LI5", name: "Alertas de Stock", type: "PAID", price: 49 },
      { id: "LI6", name: "Promo Happy Hour", type: "PAID", price: 39 },
      { id: "LI7", name: "Puntos de Lealtad", type: "PAID", price: 59 }
    ]
  },
  { 
    id: "WASH", label: "Car Wash / Estética", 
    desc: "Flujo vehicular y servicios automotrices.",
    submodules: [
      { id: "W1", name: "Reservas WhatsApp", type: "FREE" },
      { id: "W2", name: "Control de Cola", type: "FREE" },
      { id: "W3", name: "Aviso Auto Listo", type: "FREE" },
      { id: "W4", name: "Kardex de Insumos", type: "PAID", price: 59 },
      { id: "W5", name: "Rendimiento Operarios", type: "PAID", price: 49 },
      { id: "W6", name: "Membresías Lavado", type: "PAID", price: 69 },
      { id: "W7", name: "Registro Fotográfico", type: "PAID", price: 29 }
    ]
  },
  { 
    id: "REST", label: "Restaurantes / Café", 
    desc: "Atención en salón y monitor de cocina.",
    submodules: [
      { id: "R1", name: "Menú QR Digital", type: "FREE" },
      { id: "R2", name: "Pedidos en Mesa", type: "FREE" },
      { id: "R3", name: "Comandas a Cocina", type: "FREE" },
      { id: "R4", name: "Monitor de Cocina KDS", type: "PAID", price: 119 },
      { id: "R5", name: "Motor de Delivery", type: "PAID", price: 89 },
      { id: "R6", name: "Facturación Dividida", type: "PAID", price: 49 },
      { id: "R7", name: "Reservas de Mesa", type: "PAID", price: 59 }
    ]
  },
  { 
    id: "MEC", label: "Mecánica / Taller", 
    desc: "Seguimiento vehicular y presupuestos.",
    submodules: [
      { id: "M1", name: "Recepción Vehicular", type: "FREE" },
      { id: "M2", name: "Presupuestos WA", type: "FREE" },
      { id: "M3", name: "Historial de Reparación", type: "FREE" },
      { id: "M4", name: "Control de Repuestos", type: "PAID", price: 99 },
      { id: "M5", name: "Cronómetro de Tiempos", type: "PAID", price: 69 },
      { id: "M6", name: "Módulo de Garantías", type: "PAID", price: 49 },
      { id: "M7", name: "CRM Mantenimientos", type: "PAID", price: 59 }
    ]
  },
  { 
    id: "FERR", label: "Ferretería / Construcción", 
    desc: "Ventas por volumen e inventarios masivos.",
    submodules: [
      { id: "F1", name: "Buscador de Productos", type: "FREE" },
      { id: "F2", name: "Cotización PDF", type: "FREE" },
      { id: "F3", name: "Facturación B2B", type: "FREE" },
      { id: "F4", name: "Lectura de Barcode", type: "PAID", price: 89 },
      { id: "F5", name: "Kardex Avanzado", type: "PAID", price: 129 },
      { id: "F6", name: "Cuentas por Cobrar", type: "PAID", price: 99 },
      { id: "F7", name: "Gestión de Proveedores", type: "PAID", price: 79 }
    ]
  },
  { 
    id: "ABAS", label: "Markets / Tiendas", 
    desc: "Venta rápida minorista y mayorista.",
    submodules: [
      { id: "A1", name: "POS Venta Rápida", type: "FREE" },
      { id: "A2", name: "Control Balanzas", type: "FREE" },
      { id: "A3", name: "Inventario Base", type: "FREE" },
      { id: "A4", name: "Ventas al Por Mayor", type: "PAID", price: 119 },
      { id: "A5", name: "Cuentas Proveedores", type: "PAID", price: 79 },
      { id: "A6", name: "Alertas de Quiebre", type: "PAID", price: 49 },
      { id: "A7", name: "E-commerce Integrado", type: "PAID", price: 129 }
    ]
  },
  { 
    id: "BODE", label: "Bodegas / Minimarket", 
    desc: "Venta vecinal y fiados controlados.",
    submodules: [
      { id: "BO1", name: "Caja Diaria POS", type: "FREE" },
      { id: "BO2", name: "Control de Fiados", type: "FREE" },
      { id: "BO3", name: "Pedidos WA Vecino", type: "FREE" },
      { id: "BO4", name: "Gestión de Compras", type: "PAID", price: 59 },
      { id: "BO5", name: "Ranking de Ventas", type: "PAID", price: 39 },
      { id: "BO6", name: "Ofertas WhatsApp", type: "PAID", price: 49 },
      { id: "BO7", name: "Control de Gastos", type: "PAID", price: 29 }
    ]
  },
  { 
    id: "FLOT", label: "Flota Automotriz", 
    desc: "Control de vehículos y logística.",
    submodules: [
      { id: "FL1", name: "Registro de Unidades", type: "FREE" },
      { id: "FL2", name: "Plan de Rutas", type: "FREE" },
      { id: "FL3", name: "Directorio Conductores", type: "FREE" },
      { id: "FL4", name: "GPS Tiempo Real", type: "PAID", price: 199 },
      { id: "FL5", name: "Control Combustible", type: "PAID", price: 129 },
      { id: "FL6", name: "Mantenimiento Flota", type: "PAID", price: 89 },
      { id: "FL7", name: "Gastos Operativos", type: "PAID", price: 79 }
    ]
  }
];
