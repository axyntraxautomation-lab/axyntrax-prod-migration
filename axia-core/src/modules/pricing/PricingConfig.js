/**
 * PricingConfig.js
 * Configuración maestra de planes y módulos para la suite AxyntraX.
 */

export const PricingConfig = {
  planes: {
    bronce: { 
      nombre: 'Bronce', 
      base_soles: 279, 
      base_usd: 89 
    },
    plata: { 
      nombre: 'Plata', 
      base_soles: 499, 
      base_usd: 149 
    },
    oro: { 
      nombre: 'Oro', 
      base_soles: 899, 
      base_usd: 269 
    }
  },

  submodulos: {
    submodulo_base: { soles: 25, usd: 9, desc: 'Módulos operativos básicos' },
    submodulo_avanzado: { soles: 45, usd: 15, desc: 'Módulos operativos avanzados' },
    axia_motor: { soles: 89, usd: 27, desc: 'Inteligencia Artificial Axia' },
    reportes_sunat: { soles: 39, usd: 12, desc: 'Facturación y Reportes SUNAT' }
  }
};
