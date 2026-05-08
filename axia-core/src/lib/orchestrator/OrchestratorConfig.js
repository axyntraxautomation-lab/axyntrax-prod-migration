/**
 * OrchestratorConfig.js
 * Registro maestro de agentes y políticas de decisión del cerebro central.
 */

export const OrchestratorConfig = {
  // Lista oficial de agentes autorizados para reportar al bus
  agentes: [
    'AxiaGuardian',
    'IASalesWeb',
    'IAOnboarding',
    'IAFacturacion',
    'IAMarketing',
    'IABotsMedBot',
    'IABotsVetBot',
    'IABotsDentBot',
    'IABotsLexBot',
    'IABotsLogiBot',
    'IABotsCondoBot'
  ],

  // Reglas de prioridad según la naturaleza del evento
  prioridades: {
    critica: ['seguridad', 'caida_sistema', 'brecha_datos'],
    alta: ['error_modulo', 'falla_reparacion', 'morosidad_critica'],
    media: ['venda_nueva', 'onboarding_completado', 'lead_calificado'],
    info: ['reporte_rutinario', 'limpieza_completada', 'ping_ok']
  },

  // Política de decisión zonal
  politicas: {
    verde: { accion: 'auto_resolver', requiere_aprobacion: false },
    amarilla: { accion: 'proponer_miguel', requiere_aprobacion: true },
    roja: { accion: 'bloquear_y_alertar', requiere_aprobacion: true, critica: true }
  },

  // Configuración de agrupamiento de ruido (Correlación)
  correlacion: {
    ventanaMs: 5000, // Agrupar eventos similares en una ventana de 5 segundos
    maxEventosPorGrupo: 50
  }
};
