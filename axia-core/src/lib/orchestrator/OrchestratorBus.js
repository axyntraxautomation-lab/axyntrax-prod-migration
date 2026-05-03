import { create } from 'zustand';
import { OrchestratorConfig } from './OrchestratorConfig';
import { useI18nStore } from '../i18nStore';

/**
 * OrchestratorBus.js
 * Hub central de eventos con normalización dinámica.
 * Actualizado para incluir contexto de idioma global.
 */

export const useOrchestratorBus = create((set, get) => ({
  events: [],
  listeners: [],

  subscribe: (listener) => {
    set((state) => ({ listeners: [...state.listeners, listener] }));
  },

  emitEvent: (rawEvent) => {
    // Obtener idioma activo del store global
    const currentLang = useI18nStore.getState().language;

    const event = {
      agente: rawEvent.agente || 'UnknownAgent',
      evento: rawEvent.evento || 'GenericEvent',
      datos: rawEvent.datos || {},
      prioridad: rawEvent.prioridad || 'info',
      timestamp: rawEvent.timestamp || new Date().toISOString(),
      idioma: currentLang, // Contexto i18n añadido
      id: crypto.randomUUID()
    };

    if (!OrchestratorConfig.agentes.includes(event.agente)) {
      console.warn(`[OrchestratorBus] Agente no registrado: ${event.agente}`);
    }

    set((state) => ({
      events: [event, ...state.events].slice(0, 1000)
    }));

    get().listeners.forEach(listener => listener(event));
    console.log(`[Bus][${event.prioridad.toUpperCase()}][${event.idioma.toUpperCase()}] ${event.agente}: ${event.evento}`);
  }
}));

export const bus = {
  emit: (data) => useOrchestratorBus.getState().emitEvent(data),
  on: (listener) => useOrchestratorBus.getState().subscribe(listener)
};
