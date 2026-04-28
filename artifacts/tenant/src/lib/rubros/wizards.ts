/**
 * Configuración por rubro del wizard "Nueva venta".
 *
 * El wizard base tiene tres pasos: qué se vendió → quién es el cliente →
 * cómo se cobra. Cada rubro puede agregar campos extra en cada paso (placa
 * del vehículo, mesa, diagnóstico, etc.) y renombrar las etiquetas. Los
 * datos extra se guardan en `metadata.rubro` del movimiento financiero o
 * del pago QR para que después se puedan reportar.
 */

export type WizardFieldType = "text" | "select";

export type WizardField = {
  key: string;
  label: string;
  type: WizardFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export type WizardStepKey = "que" | "cliente" | "cobro";

export type RubroWizardConfig = {
  /** Etiquetas mostradas en el header del paso (override de los defaults). */
  stepLabels: Partial<Record<WizardStepKey, string>>;
  /** Campos extra inyectados en el paso "qué". */
  camposQue: WizardField[];
  /** Campos extra inyectados en el paso "cliente". */
  camposCliente: WizardField[];
  /** Si true, el wizard ofrece elegir un empleado/atendido en el paso cliente. */
  pideEmpleado: boolean;
  /**
   * Si true, el wizard agrega un paso "fecha/hora" entre cliente y cobro y, al
   * cobrar, persiste también una cita en `tenant_citas_servicios`. Pensado
   * para rubros que reservan horarios (salón, taller, gimnasio, consultoría).
   */
  pideFecha?: boolean;
  /** Texto del CTA principal del paso cobro (ej. "Cobrar lavado"). */
  ctaCobro?: string;
};

const DEFAULT: RubroWizardConfig = {
  stepLabels: { que: "Qué", cliente: "Quién", cobro: "Cómo cobrar" },
  camposQue: [],
  camposCliente: [],
  pideEmpleado: false,
  pideFecha: false,
  ctaCobro: "Cobrar",
};

const POR_RUBRO: Record<string, RubroWizardConfig> = {
  car_wash: {
    stepLabels: { que: "Qué lavado", cliente: "De quién es el carro", cobro: "Cómo cobras" },
    camposQue: [
      {
        key: "placa",
        label: "Placa del vehículo",
        type: "text",
        required: true,
        placeholder: "Ej. ABC-123",
      },
      {
        key: "tipo_vehiculo",
        label: "Tipo de vehículo",
        type: "select",
        options: ["Auto", "Camioneta", "SUV", "Moto", "Otro"],
        required: false,
      },
    ],
    camposCliente: [],
    pideEmpleado: false,
    ctaCobro: "Cobrar lavado",
  },
  restaurante: {
    stepLabels: { que: "Qué pidieron", cliente: "Para quién es", cobro: "Cómo cobras" },
    camposQue: [
      {
        key: "modalidad",
        label: "Modalidad",
        type: "select",
        options: ["Mesa", "Para llevar", "Delivery"],
        required: true,
      },
      {
        key: "mesa",
        label: "Mesa o referencia",
        type: "text",
        required: false,
        placeholder: "Ej. Mesa 4 o dirección",
      },
    ],
    camposCliente: [],
    pideEmpleado: false,
    ctaCobro: "Cobrar orden",
  },
  salon: {
    stepLabels: { que: "Qué tratamiento", cliente: "Quién atiende", cobro: "Cómo cobras" },
    camposQue: [],
    camposCliente: [],
    pideEmpleado: true,
    pideFecha: true,
    ctaCobro: "Cobrar atención",
  },
  taller: {
    stepLabels: { que: "Qué trabajo", cliente: "De quién es el vehículo", cobro: "Cómo cobras" },
    camposQue: [
      {
        key: "vehiculo",
        label: "Vehículo",
        type: "text",
        required: true,
        placeholder: "Marca, modelo y año",
      },
      {
        key: "diagnostico",
        label: "Diagnóstico",
        type: "text",
        required: true,
        placeholder: "Qué encontró el técnico",
      },
      {
        key: "aprobacion",
        label: "Aprobación del cliente",
        type: "select",
        options: ["Verbal", "WhatsApp", "Pendiente"],
        required: false,
      },
    ],
    camposCliente: [],
    pideEmpleado: true,
    pideFecha: true,
    ctaCobro: "Cobrar trabajo",
  },
  bodega: {
    stepLabels: { que: "Qué llevan", cobro: "Cómo cobras" },
    camposQue: [],
    camposCliente: [],
    pideEmpleado: false,
    ctaCobro: "Cobrar venta",
  },
  farmacia: {
    stepLabels: { que: "Qué producto", cliente: "Para quién", cobro: "Cómo cobras" },
    camposQue: [
      {
        key: "receta",
        label: "¿Hay receta médica?",
        type: "select",
        options: ["No", "Sí"],
        required: false,
      },
    ],
    camposCliente: [],
    pideEmpleado: false,
    ctaCobro: "Cobrar venta",
  },
  gimnasio: {
    stepLabels: { que: "Qué plan", cliente: "Quién es el socio", cobro: "Cómo cobras" },
    camposQue: [
      {
        key: "vigencia_dias",
        label: "Vigencia (días)",
        type: "select",
        options: ["7", "15", "30", "60", "90", "180", "365"],
        required: false,
      },
    ],
    camposCliente: [],
    pideEmpleado: false,
    pideFecha: true,
    ctaCobro: "Cobrar inscripción",
  },
  consultoria: {
    stepLabels: { que: "Qué sesión", cliente: "Con quién", cobro: "Cómo cobras" },
    camposQue: [],
    camposCliente: [],
    pideEmpleado: true,
    pideFecha: true,
    ctaCobro: "Cobrar sesión",
  },
  logistica: {
    stepLabels: { que: "Qué despacho", cliente: "Para quién", cobro: "Cómo cobras" },
    camposQue: [
      {
        key: "destino",
        label: "Destino",
        type: "text",
        required: true,
        placeholder: "Distrito o dirección",
      },
      {
        key: "modalidad",
        label: "Modalidad",
        type: "select",
        options: ["Moto", "Auto", "Camión"],
        required: false,
      },
    ],
    camposCliente: [],
    pideEmpleado: true,
    ctaCobro: "Cobrar despacho",
  },
};

export function getWizardConfig(rubroId: string | null | undefined): RubroWizardConfig {
  const cfg = POR_RUBRO[rubroId ?? ""];
  if (!cfg) return DEFAULT;
  return {
    ...DEFAULT,
    ...cfg,
    stepLabels: { ...DEFAULT.stepLabels, ...cfg.stepLabels },
  };
}
