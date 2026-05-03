import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * GuardianStore.js
 * Estado global del motor AxiaGuardian.
 * Mantiene la telemetría de uptime, historial de reparaciones y estado de salud de los servicios.
 */

export const useGuardianStore = create(
  persist(
    (set, get) => ({
      // Estado de los objetivos (online | degradado | caido)
      targetsStatus: {
        web: { status: 'online', lastCheck: new Date().toISOString() },
        dashboard: { status: 'online', lastCheck: new Date().toISOString() },
      },

      // Telemetría de la última acción del motor
      lastAction: {
        timestamp: null,
        targetId: null,
        action: null,
        zone: null,       // verde | amarilla | roja
        result: null,     // exito | fallo | revertido
        details: null
      },

      // Historial de eventos (Log de 30 días)
      history: [],

      // Acciones del Store
      updateTargetStatus: (targetId, status) => {
        set((state) => ({
          targetsStatus: {
            ...state.targetsStatus,
            [targetId]: { status, lastCheck: new Date().toISOString() }
          }
        }));
      },

      registerAction: (actionData) => {
        const timestamp = new Date().toISOString();
        const fullAction = { ...actionData, timestamp };

        set((state) => {
          // Mantener historial compacto (solo últimos 30 días / n registros)
          const newHistory = [fullAction, ...state.history].slice(0, 500); 

          return {
            lastAction: fullAction,
            history: newHistory
          };
        });
      },

      // Función de limpieza de historial (Automática o Manual)
      clearOldHistory: () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        set((state) => ({
          history: state.history.filter(log => new Date(log.timestamp) > thirtyDaysAgo)
        }));
      }
    }),
    {
      name: 'axia-guardian-storage', // Persistencia local para el motor autónomo
    }
  )
);
