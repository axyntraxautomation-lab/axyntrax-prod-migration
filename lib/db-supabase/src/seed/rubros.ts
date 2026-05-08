/**
 * Catálogo baseline de 9 rubros (Módulo 0 + Módulo 4 del spec CECILIA).
 * Para cada rubro: persona de Cecilia, módulos, terminología, alertas por defecto,
 * KPIs, pasos de onboarding, catálogo sugerido (servicios típicos en PEN para Arequipa)
 * y FAQs precargadas.
 *
 * Cuando un tenant hace signup, este registry se queda intacto y los cambios del
 * tenant van a tenant_rubro_overrides / tenant_servicios / tenant_faq_overrides.
 */

export type RubroBaseline = {
  rubroId: string;
  nombre: string;
  cecilia_persona: string;
  modulos: string[];
  terminologia: string[];
  alertas_default: string[];
  kpis: string[];
  onboarding_steps: string[];
  catalogo_sugerido: Array<{
    nombre: string;
    tipo: "servicio" | "producto";
    precio_pen: number;
    duracion_minutos?: number;
    unidad?: string;
  }>;
  faqs: Array<{ pregunta: string; respuesta: string; categoria: string }>;
};

export const RUBROS_BASELINE: RubroBaseline[] = [
  {
    rubroId: "car_wash",
    nombre: "Car Wash",
    cecilia_persona: "Asistente de lavado vehicular",
    modulos: ["vehiculos", "lavados", "insumos", "citas"],
    terminologia: ["lavado", "encerado", "pulido", "secado"],
    alertas_default: ["stock jabón <20%", "cita en 24h", "vehículo listo"],
    kpis: ["lavados/día", "ticket promedio", "clientes nuevos"],
    onboarding_steps: [
      "Configurar tarifas de lavado",
      "Registrar insumos iniciales",
      "Conectar WhatsApp Business",
    ],
    catalogo_sugerido: [
      { nombre: "Lavado simple", tipo: "servicio", precio_pen: 15, duracion_minutos: 25 },
      { nombre: "Lavado completo", tipo: "servicio", precio_pen: 25, duracion_minutos: 40 },
      { nombre: "Encerado premium", tipo: "servicio", precio_pen: 60, duracion_minutos: 75 },
      { nombre: "Pulido carrocería", tipo: "servicio", precio_pen: 120, duracion_minutos: 120 },
      { nombre: "Limpieza interior detalle", tipo: "servicio", precio_pen: 50, duracion_minutos: 60 },
      { nombre: "Shampoo de tapiz", tipo: "servicio", precio_pen: 80, duracion_minutos: 90 },
    ],
    faqs: [
      { pregunta: "¿Cuánto tarda un lavado completo?", respuesta: "Entre 30 y 45 minutos según el modelo del vehículo.", categoria: "tiempos" },
      { pregunta: "¿Aceptan Yape y Plin?", respuesta: "Sí, también recibimos efectivo y tarjeta.", categoria: "pagos" },
      { pregunta: "¿Necesito cita previa?", respuesta: "No es obligatorio, pero te garantizamos atención inmediata si reservas por WhatsApp.", categoria: "reservas" },
    ],
  },
  {
    rubroId: "restaurante",
    nombre: "Restaurante",
    cecilia_persona: "Asistente de cocina y pedidos",
    modulos: ["menu", "pedidos", "cocina", "delivery", "mesas"],
    terminologia: ["pedido", "mesa", "delivery", "comanda"],
    alertas_default: ["ingrediente <10%", "pedido >20min", "mesa libre"],
    kpis: ["pedidos/día", "ticket promedio", "delivery %"],
    onboarding_steps: [
      "Cargar menú con precios",
      "Configurar zonas delivery",
      "Conectar impresora cocina",
    ],
    catalogo_sugerido: [
      { nombre: "Menú del día", tipo: "servicio", precio_pen: 15 },
      { nombre: "Lomo saltado", tipo: "producto", precio_pen: 28 },
      { nombre: "Ají de gallina", tipo: "producto", precio_pen: 22 },
      { nombre: "Ceviche clásico", tipo: "producto", precio_pen: 32 },
      { nombre: "Arroz con pollo", tipo: "producto", precio_pen: 20 },
      { nombre: "Chicha morada 1L", tipo: "producto", precio_pen: 10 },
      { nombre: "Delivery zona 1", tipo: "servicio", precio_pen: 5 },
    ],
    faqs: [
      { pregunta: "¿Hacen delivery?", respuesta: "Sí, dentro de Arequipa metropolitana. El costo depende de la zona.", categoria: "delivery" },
      { pregunta: "¿Tienen menú vegetariano?", respuesta: "Sí, consulta nuestro menú del día por opciones sin carne.", categoria: "menu" },
      { pregunta: "¿Aceptan reservas?", respuesta: "Sí, escríbenos por WhatsApp para reservar tu mesa.", categoria: "reservas" },
    ],
  },
  {
    rubroId: "salon",
    nombre: "Salón de Belleza",
    cecilia_persona: "Asistente de citas y estética",
    modulos: ["servicios", "citas", "estilistas", "productos"],
    terminologia: ["cita", "corte", "tinte", "manicure"],
    alertas_default: ["tinte <2 unid", "cita en 1h", "estilista libre"],
    kpis: ["citas/día", "servicios más pedidos", "retención clientes"],
    onboarding_steps: [
      "Registrar estilistas y horarios",
      "Configurar servicios y precios",
      "Activar recordatorios automáticos",
    ],
    catalogo_sugerido: [
      { nombre: "Corte de cabello dama", tipo: "servicio", precio_pen: 25, duracion_minutos: 45 },
      { nombre: "Corte de cabello varón", tipo: "servicio", precio_pen: 18, duracion_minutos: 30 },
      { nombre: "Tinte completo", tipo: "servicio", precio_pen: 80, duracion_minutos: 90 },
      { nombre: "Mechas", tipo: "servicio", precio_pen: 120, duracion_minutos: 120 },
      { nombre: "Manicure", tipo: "servicio", precio_pen: 20, duracion_minutos: 40 },
      { nombre: "Pedicure", tipo: "servicio", precio_pen: 25, duracion_minutos: 45 },
      { nombre: "Tratamiento capilar", tipo: "servicio", precio_pen: 50, duracion_minutos: 60 },
    ],
    faqs: [
      { pregunta: "¿Cómo reservo una cita?", respuesta: "Te puedo agendar por aquí mismo. Indícame fecha, hora y servicio.", categoria: "reservas" },
      { pregunta: "¿Cuánto cuesta un tinte?", respuesta: "Desde S/ 80 según el largo del cabello y la marca del producto.", categoria: "precios" },
      { pregunta: "¿Trabajan domingos?", respuesta: "Sí, con cita previa. Te confirmo disponibilidad.", categoria: "horarios" },
    ],
  },
  {
    rubroId: "taller",
    nombre: "Taller Mecánico",
    cecilia_persona: "Asistente técnico automotriz",
    modulos: ["vehiculos", "reparaciones", "repuestos", "ordenes"],
    terminologia: ["orden trabajo", "diagnóstico", "repuesto", "entrega"],
    alertas_default: ["repuesto agotado", "vehículo listo", "pago pendiente"],
    kpis: ["órdenes/semana", "tiempo promedio", "repuestos más usados"],
    onboarding_steps: [
      "Configurar tipos de servicio",
      "Cargar inventario de repuestos",
      "Activar notificaciones cliente",
    ],
    catalogo_sugerido: [
      { nombre: "Diagnóstico computarizado", tipo: "servicio", precio_pen: 50, duracion_minutos: 30 },
      { nombre: "Cambio de aceite y filtro", tipo: "servicio", precio_pen: 120, duracion_minutos: 45 },
      { nombre: "Alineamiento y balanceo", tipo: "servicio", precio_pen: 80, duracion_minutos: 60 },
      { nombre: "Cambio de pastillas de freno", tipo: "servicio", precio_pen: 150, duracion_minutos: 90 },
      { nombre: "Afinamiento general", tipo: "servicio", precio_pen: 280, duracion_minutos: 180 },
      { nombre: "Revisión técnica preventiva", tipo: "servicio", precio_pen: 40, duracion_minutos: 30 },
    ],
    faqs: [
      { pregunta: "¿Cuánto tarda un afinamiento?", respuesta: "Entre 3 y 4 horas dependiendo del modelo.", categoria: "tiempos" },
      { pregunta: "¿Tienen garantía las reparaciones?", respuesta: "Sí, todas nuestras reparaciones tienen 30 días de garantía.", categoria: "garantia" },
      { pregunta: "¿Trabajan con todas las marcas?", respuesta: "Trabajamos marcas japonesas, coreanas, americanas y europeas.", categoria: "marcas" },
    ],
  },
  {
    rubroId: "gimnasio",
    nombre: "Gimnasio",
    cecilia_persona: "Asistente de membresías y rutinas",
    modulos: ["membresias", "clases", "rutinas", "asistencia"],
    terminologia: ["membresía", "rutina", "clase", "entrenador"],
    alertas_default: ["membresía vence en 3d", "clase llena", "asistencia <30%"],
    kpis: ["miembros activos", "asistencia promedio", "renovaciones"],
    onboarding_steps: [
      "Configurar planes y tarifas",
      "Registrar entrenadores y clases",
      "Activar control de asistencia",
    ],
    catalogo_sugerido: [
      { nombre: "Membresía mensual", tipo: "servicio", precio_pen: 90 },
      { nombre: "Membresía trimestral", tipo: "servicio", precio_pen: 240 },
      { nombre: "Membresía anual", tipo: "servicio", precio_pen: 840 },
      { nombre: "Pase diario", tipo: "servicio", precio_pen: 15 },
      { nombre: "Clase de spinning", tipo: "servicio", precio_pen: 20, duracion_minutos: 60 },
      { nombre: "Sesión personal trainer", tipo: "servicio", precio_pen: 60, duracion_minutos: 60 },
    ],
    faqs: [
      { pregunta: "¿Cuál es el horario?", respuesta: "Lunes a sábado de 6:00 a.m. a 10:00 p.m. Domingos de 8:00 a.m. a 2:00 p.m.", categoria: "horarios" },
      { pregunta: "¿Tienen entrenador personal?", respuesta: "Sí, ofrecemos sesiones individuales con entrenadores certificados.", categoria: "servicios" },
      { pregunta: "¿Puedo congelar mi membresía?", respuesta: "Sí, hasta por 30 días al año con justificación.", categoria: "membresias" },
    ],
  },
  {
    rubroId: "farmacia",
    nombre: "Farmacia",
    cecilia_persona: "Asistente de medicamentos y stock",
    modulos: ["medicamentos", "ventas", "recetas", "stock"],
    terminologia: ["medicamento", "receta", "lote", "vencimiento"],
    alertas_default: ["stock <10 unid", "lote vence en 30d", "receta pendiente"],
    kpis: ["ventas/día", "medicamentos más vendidos", "rotación stock"],
    onboarding_steps: [
      "Cargar catálogo de medicamentos",
      "Configurar alertas de vencimiento",
      "Conectar con DIGEMID si aplica",
    ],
    catalogo_sugerido: [
      { nombre: "Paracetamol 500mg x10", tipo: "producto", precio_pen: 4 },
      { nombre: "Ibuprofeno 400mg x10", tipo: "producto", precio_pen: 6 },
      { nombre: "Amoxicilina 500mg x21", tipo: "producto", precio_pen: 18 },
      { nombre: "Vitamina C efervescente x10", tipo: "producto", precio_pen: 12 },
      { nombre: "Suero oral 500ml", tipo: "producto", precio_pen: 5 },
      { nombre: "Alcohol 70° 250ml", tipo: "producto", precio_pen: 4 },
      { nombre: "Mascarilla quirúrgica caja x50", tipo: "producto", precio_pen: 15 },
    ],
    faqs: [
      { pregunta: "¿Hacen delivery de medicamentos?", respuesta: "Sí, dentro de Arequipa metropolitana en menos de 1 hora.", categoria: "delivery" },
      { pregunta: "¿Necesito receta?", respuesta: "Para antibióticos y controlados sí. Para venta libre no es necesaria.", categoria: "recetas" },
      { pregunta: "¿Tienen genéricos?", respuesta: "Sí, manejamos opciones genéricas y comerciales para que elijas.", categoria: "productos" },
    ],
  },
  {
    rubroId: "bodega",
    nombre: "Bodega / Minimarket",
    cecilia_persona: "Asistente de stock y ventas",
    modulos: ["productos", "ventas", "stock", "proveedores"],
    terminologia: ["producto", "stock", "venta", "proveedor"],
    alertas_default: ["stock <5 unid", "producto sin movimiento 30d", "caja >S/500"],
    kpis: ["ventas/día", "productos top", "margen promedio"],
    onboarding_steps: [
      "Cargar productos y precios",
      "Configurar control de stock",
      "Registrar proveedores principales",
    ],
    catalogo_sugerido: [
      { nombre: "Inca Kola 1.5L", tipo: "producto", precio_pen: 6 },
      { nombre: "Pan francés (unidad)", tipo: "producto", precio_pen: 0.30, unidad: "unidad" },
      { nombre: "Arroz Costeño 5kg", tipo: "producto", precio_pen: 18 },
      { nombre: "Aceite Primor 1L", tipo: "producto", precio_pen: 12 },
      { nombre: "Azúcar rubia 1kg", tipo: "producto", precio_pen: 4 },
      { nombre: "Leche Gloria evaporada 410g", tipo: "producto", precio_pen: 5 },
      { nombre: "Huevos x12", tipo: "producto", precio_pen: 9 },
    ],
    faqs: [
      { pregunta: "¿Hasta qué hora abren?", respuesta: "Lunes a domingo de 7:00 a.m. a 11:00 p.m.", categoria: "horarios" },
      { pregunta: "¿Hacen delivery?", respuesta: "Sí, pedidos sobre S/ 30 dentro de 5 cuadras a la redonda.", categoria: "delivery" },
      { pregunta: "¿Aceptan Yape y Plin?", respuesta: "Sí, también efectivo. Pedidos grandes también con tarjeta.", categoria: "pagos" },
    ],
  },
  {
    rubroId: "consultoria",
    nombre: "Consultoría",
    cecilia_persona: "Asistente de proyectos y clientes",
    modulos: ["proyectos", "clientes", "horas", "facturacion"],
    terminologia: ["proyecto", "consultor", "entrega", "factura"],
    alertas_default: ["entrega en 24h", "cliente sin contacto 14d", "proyecto sin avance 7d"],
    kpis: ["horas facturables", "proyectos activos", "rentabilidad/cliente"],
    onboarding_steps: [
      "Registrar consultores y áreas",
      "Configurar tarifas por hora",
      "Activar tracking de proyectos",
    ],
    catalogo_sugerido: [
      { nombre: "Hora consultoría senior", tipo: "servicio", precio_pen: 280, duracion_minutos: 60 },
      { nombre: "Hora consultoría junior", tipo: "servicio", precio_pen: 120, duracion_minutos: 60 },
      { nombre: "Diagnóstico inicial", tipo: "servicio", precio_pen: 800 },
      { nombre: "Plan estratégico anual", tipo: "servicio", precio_pen: 6500 },
      { nombre: "Capacitación in-house (8h)", tipo: "servicio", precio_pen: 2400 },
      { nombre: "Auditoría procesos", tipo: "servicio", precio_pen: 3500 },
    ],
    faqs: [
      { pregunta: "¿Cuál es el costo por hora?", respuesta: "Depende del nivel del consultor. Senior desde S/ 280 + IGV.", categoria: "precios" },
      { pregunta: "¿Trabajan presencial o remoto?", respuesta: "Ambas modalidades. Remoto vía Zoom/Meet, presencial en Arequipa.", categoria: "modalidad" },
      { pregunta: "¿Emiten factura?", respuesta: "Sí, factura electrónica con 18% IGV vía SUNAT.", categoria: "facturacion" },
    ],
  },
  {
    rubroId: "logistica",
    nombre: "Logística",
    cecilia_persona: "Asistente de envíos y almacén",
    modulos: ["envios", "rutas", "almacen", "conductores"],
    terminologia: ["envío", "ruta", "guía", "almacén"],
    alertas_default: ["envío atrasado", "almacén >90% capacidad", "ruta sin conductor"],
    kpis: ["envíos/día", "tiempo entrega promedio", "ocupación almacén"],
    onboarding_steps: [
      "Registrar conductores y vehículos",
      "Cargar zonas y tarifas",
      "Conectar tracking de envíos",
    ],
    catalogo_sugerido: [
      { nombre: "Envío local Arequipa (hasta 5kg)", tipo: "servicio", precio_pen: 12 },
      { nombre: "Envío local Arequipa (5-20kg)", tipo: "servicio", precio_pen: 25 },
      { nombre: "Envío interprovincial Lima", tipo: "servicio", precio_pen: 45 },
      { nombre: "Envío Cusco / Puno", tipo: "servicio", precio_pen: 35 },
      { nombre: "Almacenaje m3/mes", tipo: "servicio", precio_pen: 80, unidad: "m3" },
      { nombre: "Carga express Arequipa", tipo: "servicio", precio_pen: 30 },
    ],
    faqs: [
      { pregunta: "¿En cuánto tiempo entregan en Lima?", respuesta: "Entre 24 y 48 horas según la ruta y modalidad.", categoria: "tiempos" },
      { pregunta: "¿Aseguran la carga?", respuesta: "Sí, todos los envíos tienen seguro hasta por el valor declarado.", categoria: "seguro" },
      { pregunta: "¿Hacen recojo a domicilio?", respuesta: "Sí, dentro de Arequipa metropolitana sin costo adicional.", categoria: "recojo" },
    ],
  },
];
