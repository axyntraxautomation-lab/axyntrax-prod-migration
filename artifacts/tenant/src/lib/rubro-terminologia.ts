/**
 * Mapa de terminología por rubro: rebautiza módulos visibles del dashboard
 * según el negocio del tenant. La estructura de datos en Supabase no cambia,
 * solo las etiquetas que ve el usuario final.
 */
export type ModuloKey =
  | "catalogo"
  | "agenda"
  | "venta"
  | "clientes"
  | "inventario";

type Terminologia = Record<ModuloKey, string>;

const DEFAULT: Terminologia = {
  catalogo: "Servicios",
  agenda: "Agenda",
  venta: "Nueva venta",
  clientes: "Clientes",
  inventario: "Inventario",
};

const POR_RUBRO: Record<string, Partial<Terminologia>> = {
  car_wash: {
    catalogo: "Servicios",
    agenda: "Agenda",
    venta: "Nuevo lavado",
    clientes: "Clientes",
    inventario: "Insumos",
  },
  restaurante: {
    catalogo: "Menú",
    agenda: "Reservas",
    venta: "Nueva orden",
    clientes: "Comensales",
    inventario: "Almacén",
  },
  bodega: {
    catalogo: "Productos",
    agenda: "Agenda",
    venta: "Nueva venta",
    clientes: "Clientes",
    inventario: "Stock",
  },
  farmacia: {
    catalogo: "Productos",
    agenda: "Agenda",
    venta: "Nueva venta",
    clientes: "Pacientes",
    inventario: "Stock",
  },
  salon: {
    catalogo: "Tratamientos",
    agenda: "Agenda",
    venta: "Nueva atención",
    clientes: "Clientes",
    inventario: "Insumos",
  },
  taller: {
    catalogo: "Servicios",
    agenda: "Trabajos",
    venta: "Nuevo trabajo",
    clientes: "Clientes",
    inventario: "Repuestos",
  },
  gimnasio: {
    catalogo: "Planes",
    agenda: "Clases",
    venta: "Nueva inscripción",
    clientes: "Socios",
    inventario: "Inventario",
  },
  consultoria: {
    catalogo: "Servicios",
    agenda: "Sesiones",
    venta: "Nueva sesión",
    clientes: "Clientes",
    inventario: "Materiales",
  },
  logistica: {
    catalogo: "Servicios",
    agenda: "Despachos",
    venta: "Nuevo despacho",
    clientes: "Clientes",
    inventario: "Inventario",
  },
};

export function getTerminologia(rubroId: string | null | undefined): Terminologia {
  return { ...DEFAULT, ...(POR_RUBRO[rubroId ?? ""] ?? {}) };
}
