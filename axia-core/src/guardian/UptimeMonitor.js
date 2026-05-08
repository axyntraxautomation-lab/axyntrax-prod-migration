import { GuardianConfig } from './GuardianConfig';
import { useGuardianStore } from './GuardianStore';
import { GuardianAlerts } from './GuardianAlerts';
import { bus } from '../lib/orchestrator/OrchestratorBus';

/**
 * UptimeMonitor.js
 * Servicio autónomo de vigilancia.
 * Actualizado para reportar estados y acciones al OrchestratorBus.
 */

class UptimeMonitor {
  constructor() {
    this.intervalId = null;
    this.isChecking = false;
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.performCheck(), GuardianConfig.checkIntervalSegundos * 1000);
    this.performCheck();
  }

  async performCheck() {
    if (this.isChecking) return;
    this.isChecking = true;

    for (const target of GuardianConfig.targets) {
      try {
        const start = performance.now();
        const response = await fetch(target.url, { method: 'GET', cache: 'no-cache' });
        const latency = Math.round(performance.now() - start);
        const status = response.ok ? 'online' : 'degradado';

        useGuardianStore.getState().updateTargetStatus(target.id, status);

        if (!response.ok) {
          await this.handleFailure(target, `Status ${response.status}`, latency);
        }

      } catch (error) {
        useGuardianStore.getState().updateTargetStatus(target.id, 'caido');
        await this.handleFailure(target, error.message, 0);
      }
    }
    this.isChecking = false;
  }

  async handleFailure(target, errorMsg, latency) {
    // Reportar evento de caída al Bus
    bus.emit({
      agente: 'AxiaGuardian',
      evento: 'TARGET_DOWN',
      datos: { target: target.id, error: errorMsg, latency },
      prioridad: 'critica'
    });

    const action = "reiniciar_servicio";
    
    // Reportar inicio de auto-reparación
    bus.emit({
      agente: 'AxiaGuardian',
      evento: 'HEALING_STARTED',
      datos: { target: target.id, action, zone: 'verde' },
      prioridad: 'alta'
    });

    const success = await this.simulateAction(action);

    if (success) {
      bus.emit({
        agente: 'AxiaGuardian',
        evento: 'HEALING_SUCCESS',
        datos: { target: target.id, action, resolution_time: '2s' },
        prioridad: 'info'
      });
    } else {
      bus.emit({
        agente: 'AxiaGuardian',
        evento: 'HEALING_FAILURE',
        datos: { target: target.id, action, next_zone: 'amarilla' },
        prioridad: 'critica'
      });
      GuardianAlerts.sendCriticalAlert({ target: target.nombre, type: 'CAIDA_SISTEMA', result: 'fallo' });
    }
  }

  async simulateAction(action) {
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.1), 1000));
  }
}

export const uptimeMonitor = new UptimeMonitor();
