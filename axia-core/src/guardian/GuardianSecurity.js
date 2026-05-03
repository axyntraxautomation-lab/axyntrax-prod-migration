import { useGuardianStore } from './GuardianStore';
import { GuardianAlerts } from './GuardianAlerts';
import { bus } from '../lib/orchestrator/OrchestratorBus';

/**
 * GuardianSecurity.js
 * Actualizado para reportar amenazas y acciones defensivas al OrchestratorBus.
 */

export const GuardianSecurity = {
  async runSecurityAudit() {
    console.log('[GuardianSecurity] Iniciando auditoría...');

    // 1. Detección de Amenazas (Simulado)
    if (Math.random() > 0.8) {
       const threat = { type: 'BRUTE_FORCE_ATTEMPT', ip: '192.168.1.100', severity: 'alta' };
       
       // Reportar Amenaza al Bus
       bus.emit({
         agente: 'AxiaGuardian',
         evento: 'SECURITY_THREAT_DETECTED',
         datos: threat,
         prioridad: 'alta'
       });

       await this.handleThreat(threat);
       return false;
    }

    // 2. npm audit (Simulado)
    const auditStatus = Math.random() > 0.9 ? 'VULNERABILITIES_FOUND' : 'CLEAN';
    if (auditStatus !== 'CLEAN') {
       bus.emit({
         agente: 'AxiaGuardian',
         evento: 'NPM_AUDIT_RISK',
         datos: { vulnerabilities: 3, level: 'low' },
         prioridad: 'media'
       });
    }

    return true;
  },

  async handleThreat(threat) {
    // Zona Verde: Bloqueo automático
    if (threat.severity === 'verde' || threat.severity === 'alta') {
       bus.emit({
         agente: 'AxiaGuardian',
         evento: 'DEFENSIVE_ACTION_EXECUTED',
         datos: { action: 'IP_BLOCK', target: threat.ip },
         prioridad: 'media'
       });
       
       useGuardianStore.getState().registerAction({
         action: 'bloqueo_ip',
         zone: 'verde',
         result: 'exito',
         details: `IP ${threat.ip} mitigada.`
       });
    } else {
       // Zona Amarilla/Roja
       GuardianAlerts.sendCriticalAlert({ target: 'Seguridad', type: 'AMENAZA_EXTERNA', result: 'pendiente' });
    }
  }
};
