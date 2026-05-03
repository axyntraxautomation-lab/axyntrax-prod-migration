import { bus } from './OrchestratorBus';
import { OrchestratorConfig } from './OrchestratorConfig';

/**
 * OrchestratorBrain.js
 * El cerebro central que correlaciona ruidos de múltiples agentes y decide acciones.
 */

class OrchestratorBrain {
  constructor() {
    this.eventBuffer = [];
    this.isInitializing = false;
  }

  /**
   * Inicializa la escucha del bus de eventos.
   */
  init() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    console.log('[OrchestratorBrain] Cerebro activo. Escuchando agentes...');
    
    bus.on((event) => {
      this.processEvent(event);
    });
  }

  /**
   * Analiza un evento entrante y aplica la política de correlación.
   */
  processEvent(event) {
    this.eventBuffer.push(event);

    // Correlacionar ruidos (Ejemplo: si 3 bots reportan error de API, es una falla sistémica)
    const similarEvents = this.eventBuffer.filter(e => 
      e.evento === event.evento && 
      (new Date() - new Date(e.timestamp)) < OrchestratorConfig.correlacion.ventanaMs
    );

    if (similarEvents.length >= 3) {
      this.handleCorrelatedIncident(similarEvents);
      // Limpiar buffer de este tipo de evento para evitar spam
      this.eventBuffer = this.eventBuffer.filter(e => e.evento !== event.evento);
      return;
    }

    // Proceso de evento individual si no hay ruido agrupado
    this.decide(event);
  }

  /**
   * Decisión basada en Zonas y Prioridades.
   */
  decide(event) {
    const { politicas } = OrchestratorConfig;

    // Determinar zona (simulado por ahora, en prod viene del agente)
    const zona = event.prioridad === 'critica' ? 'roja' : 
                 event.prioridad === 'alta' ? 'amarilla' : 'verde';

    const politica = politicas[zona];

    console.log(`[Brain][Decisión] Agente: ${event.agente} | Acción: ${politica.accion}`);

    switch (politica.accion) {
      case 'auto_resolver':
        this.executeAutoRepair(event);
        break;
      case 'proponer_miguel':
        this.requestApproval(event);
        break;
      case 'bloquear_y_alertar':
        this.blockAndLock(event);
        break;
    }
  }

  handleCorrelatedIncident(events) {
    console.warn(`[OrchestratorBrain] Incidente CORRELACIONADO detectado de ${events.length} agentes.`);
    this.decide({
       agente: 'OrchestratorBrain',
       evento: 'INCIDENTE_SISTEMICO',
       prioridad: 'critica',
       datos: { agentes_afectados: events.map(e => e.agente) }
    });
  }

  executeAutoRepair(event) {
    // Comunicar a GuardianHealingEngine en producción
    console.log(`[Brain] Ejecutando reparación automática para: ${event.evento}`);
  }

  requestApproval(event) {
    // Comunicar a GuardianAlerts para Dashboard Miguel
    console.log(`[Brain] Solicitando aprobación a Miguel para: ${event.evento}`);
  }

  blockAndLock(event) {
    console.error(`[Brain] ACCION BLOQUEADA (Zona Roja). Notificando falla crítica.`);
  }
}

export const orchestratorBrain = new OrchestratorBrain();
// Iniciar automáticamente al importar en el punto de entrada de la app
orchestratorBrain.init();
