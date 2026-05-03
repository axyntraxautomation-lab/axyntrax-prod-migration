import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * i18nStore.js
 * Store global de internacionalización para la suite AxyntraX.
 * Controla el idioma de todas las IAs y componentes orientados al cliente.
 */

export const useI18nStore = create(
  persist(
    (set) => ({
      language: 'es', // 'es' | 'en'

      /**
       * Cambia el idioma global. 
       * Las IAs conectadas reaccionarán automáticamente.
       */
      setLanguage: (lang) => {
        if (!['es', 'en'].includes(lang)) return;
        set({ language: lang });
        console.log(`[i18n] Idioma cambiado a: ${lang.toUpperCase()}`);
      }
    }),
    {
      name: 'axia-i18n-storage',
    }
  )
);

/**
 * Helper para obtener traducciones rápidas
 */
export const t = (obj, lang) => {
  if (!obj) return '';
  return obj[lang] || obj['es'] || ''; // Fallback a español
};
