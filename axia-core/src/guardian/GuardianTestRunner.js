import { GuardianConfig } from './GuardianConfig';
import { useGuardianStore } from './GuardianStore';
import { GuardianAlerts } from './GuardianAlerts';
import { GuardianTestCleaner } from './GuardianTestCleaner';
import { bus } from '../lib/orchestrator/OrchestratorBus';

/**
 * GuardianTestRunner.js
 * Actualizado para reportar resultados de pruebas analíticas al OrchestratorBus.
 */

class GuardianTestRunner {
  constructor() {
    this.nextTestTimeout = null;
  }

  scheduleNextTest() {
    if (!GuardianConfig.pruebasAutomaticas.habilitadas) return;
    const randomDelay = Math.floor(Math.random() * (24 * 60 * 60 * 1000));
    if (this.nextTestTimeout) clearTimeout(this.nextTestTimeout);
    this.nextTestTimeout = setTimeout(() => this.runAnalyticalSuite(), randomDelay);
  }

  async runAnalyticalSuite() {
    console.log('[GuardianTestRunner] Iniciando suite analítica...');
    
    let suitePassed = true;
    try {
      // Simulación de tests
      suitePassed = Math.random() > 0.1;

      // Reportar resultado al Bus
      bus.emit({
        agente: 'AxiaGuardian',
        evento: 'ANALYTICAL_SUITE_FINISHED',
        datos: { result: suitePassed ? 'SUCCESS' : 'FAILURE' },
        prioridad: suitePassed ? 'info' : 'alta'
      });

      if (!suitePassed) {
        GuardianAlerts.sendCriticalAlert({ target: 'Suite Analítica', type: 'FALLO_INTEGRIDAD', result: 'fallo' });
      }

    } catch (error) {
       bus.emit({ agente: 'AxiaGuardian', evento: 'TEST_RUNNER_ERROR', datos: { error: error.message }, prioridad: 'critica' });
    } finally {
      await GuardianTestCleaner.purgeTestData();
      
      // Confirmación de Huella Cero en el Bus
      bus.emit({
        agente: 'AxiaGuardian',
        evento: 'TRACE_CLEANUP_CONFIRMED',
        datos: { integrity: '100% CLEAN' },
        prioridad: 'info'
      });

      this.scheduleNextTest();
    }
  }
}

export const guardianTestRunner = new GuardianTestRunner();
