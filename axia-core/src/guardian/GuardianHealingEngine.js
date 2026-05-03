import { useGuardianStore } from './GuardianStore';
import { GuardianAlerts } from './GuardianAlerts';

/**
 * GuardianHealingEngine.js
 * Motor de auto-reparación técnica de AxiaGuardian.
 * Implementa Runbooks atómicos para la recuperación de servicios críticos.
 */

export const GuardianHealingEngine = {
  /**
   * Ejecuta un procedimiento de reparación según el tipo de incidente.
   * @param {string} incidentType - SERVICE_DOWN | ERROR_5XX | CACHE_CORRUPT | SSL_EXPIRED
   * @param {Object} target - El objetivo afectado
   */
  async triggerHealing(incidentType, target) {
    const startTime = performance.now();
    console.log(`[GuardianHealingEngine] Iniciando Runbook: ${incidentType} para ${target.nombre}`);

    let report = {
      problem: incidentType,
      action: null,
      result: 'fallo',
      duration: 0
    };

    try {
      // 1. BACKUP PREVIO (Snapshot de estado)
      await this.takeStateSnapshot(target);

      // 2. EJECUCION DE ACCION
      switch (incidentType) {
        case 'SERVICE_DOWN':
          report.action = 'reiniciar_instancia';
          await this.restartService(target);
          break;
        case 'ERROR_5XX':
          report.action = 'rollback_version_estable';
          await this.performRollback(target);
          break;
        case 'CACHE_CORRUPT':
          report.action = 'purga_cache_atomica';
          await this.clearCache(target);
          break;
        case 'SSL_EXPIRED':
          report.action = 'renovacion_ssl_automatica';
          await this.renewSSL(target);
          break;
        default:
          throw new Error('Tipo de incidente no reconocido');
      }

      // 3. VERIFICACION
      const verified = await this.verifyResolution(target);
      
      if (verified) {
        report.result = 'exito';
      } else {
        // 4. ROLLBACK SI FALLA
        await this.revertFromSnapshot(target);
        report.result = 'revertido';
      }

    } catch (error) {
      console.error(`[GuardianHealingEngine] Error en reparacion:`, error.message);
      report.details = error.message;
    } finally {
      const endTime = performance.now();
      report.duration = Math.round((endTime - startTime) / 1000);

      // Registrar en el Store
      useGuardianStore.getState().registerAction({
        targetId: target.id,
        action: report.action,
        zone: report.result === 'exito' ? 'verde' : 'amarilla',
        result: report.result,
        details: `Resolución en ${report.duration}s. Problema: ${report.problem}`
      });

      // Notificar si no fue éxito total
      if (report.result !== 'exito') {
        GuardianAlerts.sendCriticalAlert({
          target: target.nombre,
          type: 'FALLO_AUTOREPARACION',
          message: `El runbook ${report.action} no logró normalizar el sistema.`,
          actionTaken: report.action,
          result: report.result
        });
      }
    }
  },

  async takeStateSnapshot(target) {
    console.log(`[GuardianHealingEngine] Creando Snapshot de seguridad para ${target.id}`);
    return true; 
  },

  async restartService(target) {
    console.log(`[GuardianHealingEngine] Rearrancando servicio...`);
    return new Promise(resolve => setTimeout(resolve, 2000));
  },

  async performRollback(target) {
    console.log(`[GuardianHealingEngine] Ejecutando Rollback a versión estable anterior...`);
    return new Promise(resolve => setTimeout(resolve, 3000));
  },

  async clearCache(target) {
    console.log(`[GuardianHealingEngine] Limpiando caché del servidor...`);
    return new Promise(resolve => setTimeout(resolve, 1000));
  },

  async renewSSL(target) {
    console.log(`[GuardianHealingEngine] Solicitando renovación de certificado SSL...`);
    return new Promise(resolve => setTimeout(resolve, 5000));
  },

  async verifyResolution(target) {
    console.log(`[GuardianHealingEngine] Verificando salud post-reparacion...`);
    // Simulacion de exito en el 85% de los casos
    return Math.random() > 0.15;
  },

  async revertFromSnapshot(target) {
    console.warn(`[GuardianHealingEngine] Restaurando estado previo por fallo en reparación.`);
    return true;
  }
};
