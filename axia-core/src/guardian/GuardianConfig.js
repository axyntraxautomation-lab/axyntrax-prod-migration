import { bus } from '../lib/orchestrator/OrchestratorBus';

/**
 * GuardianConfig.js
 * Configuración central del motor AxiaGuardian.
 * Actualizado para integración con OrchestratorBus.
 */

export const GuardianConfig = {
  targets: [
    { 
      id: "web", 
      nombre: "Web AxyntraX", 
      url: "https://axyntrax-automation.netlify.app/",
      tipo: "web" 
    },
    { 
      id: "dashboard", 
      nombre: "Dashboard Miguel", 
      url: "https://app.axyntrax.com", 
      tipo: "app" 
    }
  ],
  checkIntervalSegundos: 30,
  alertaCorreo: "miguel@axyntrax.com",
  alertaWhatsApp: true,
  
  // Referencia centralizada al bus para los sub-módulos del guardián
  orchestrator: bus,

  zonas: {
    verde: ["reiniciar_servicio", "limpiar_cache", "vaciar_cola", "rollback_automatico"],
    amarilla: ["actualizar_dependencia_mayor", "cambiar_esquema_bd", "modificar_config_servidor"],
    roja: ["borrar_datos", "cambiar_precios", "desactivar_modulos_clientes", "acceso_datos_sensibles"]
  },
  
  pruebasAutomaticas: {
    habilitadas: true,
    horaEjecucion: "aleatoria_diaria",
    eliminarDespuesDeEjecutar: true,
    registrarResultado: true
  }
};
