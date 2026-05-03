/**
 * OnboardingConfig.js
 * Configuración bilingüe del flujo de activación.
 */

export const OnboardingConfig = {
  steps: [
    { 
      id: 'welcome', 
      title: { es: 'Bienvenida', en: 'Welcome' }, 
      desc: { es: '¡Felicidades por elegir AxyntraX!', en: 'Congratulations on choosing AxyntraX!' } 
    },
    { 
      id: 'business_data', 
      title: { es: 'Datos de Empresa', en: 'Business Data' }, 
      desc: { es: 'Confirmemos la información de su negocio.', en: 'Let\'s confirm your business information.' } 
    },
    { 
      id: 'tax_config', 
      title: { es: 'Impuesto Local', en: 'Local Taxes' }, 
      desc: { es: 'Configuración de IGV/VAT/IVA.', en: 'Configuring IGV/VAT/IVA settings.' } 
    },
    { 
      id: 'health_check', 
      title: { es: 'Prueba de Vuelo', en: 'Flight Check' }, 
      desc: { es: 'Validación de sincronización.', en: 'Sync validation process.' } 
    }
  ],

  aiMessages: {
    welcome: {
      es: "¡Excelente inicio! He preparado todo para su configuración.",
      en: "Great start! I have prepared everything for your setup."
    },
    tax_config: {
      es: "No se preocupe por el cálculo, yo me encargo de la precisión.",
      en: "Don't worry about the calculations, I'll handle the precision."
    },
    congratulations: {
      es: "¡Felicidades! Su suite está lista para despegar.",
      en: "Congratulations! Your suite is ready for takeoff."
    }
  }
};
