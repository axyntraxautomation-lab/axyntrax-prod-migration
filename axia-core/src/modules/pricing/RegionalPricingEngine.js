import { PricingConfig } from './PricingConfig';
import { bus } from '../../lib/orchestrator/OrchestratorBus';

/**
 * RegionalPricingEngine.js
 * Motor de cálculo de precios dinámicos según geolocalización.
 */

export const RegionalPricingEngine = {
  /**
   * Calcula el presupuesto detallado para un cliente.
   * @param {string} planId - bronre | plata | oro
   * @param {string[]} selectedSubmodules - Array de IDs de submódulos
   * @param {string} countryCode - 'PE' | 'US' | 'ES' | etc.
   */
  calculateDetailedPricing(planId, selectedSubmodules = [], countryCode = 'PE') {
    const isPeru = countryCode === 'PE';
    const plan = PricingConfig.planes[planId];
    
    if (!plan) throw new Error(`Plan no válido: ${planId}`);

    let subtotal = isPeru ? plan.base_soles : plan.base_usd;
    const currency = isPeru ? 'S/.' : 'USD';

    // Sumar submódulos
    selectedSubmodules.forEach(subId => {
      const sub = PricingConfig.submodulos[subId];
      if (sub) {
        subtotal += isPeru ? sub.soles : sub.usd;
      }
    });

    let recargoInternacional = 0;
    let impuesto = 0;
    let total = 0;

    if (isPeru) {
      // Regla Perú: Subtotal + 18% IGV
      impuesto = subtotal * 0.18;
      total = subtotal + impuesto;
    } else {
      // Regla Internacional: Subtotal + 15% Recargo + 5% Impuesto Local (Promedio)
      recargoInternacional = subtotal * 0.15;
      const baseConRecargo = subtotal + recargoInternacional;
      impuesto = baseConRecargo * 0.05; 
      total = baseConRecargo + impuesto;
    }

    const result = {
      country: countryCode,
      currency,
      subtotal: this.format(subtotal),
      recargo: this.format(recargoInternacional),
      impuesto: this.format(impuesto),
      total: this.format(total),
      raw: { subtotal, recargoInternacional, impuesto, total }
    };

    // Reportar al OrchestratorBus (IAFacturacion)
    bus.emit({
      agente: 'IAFacturacion',
      evento: 'PRICING_CALCULATED',
      datos: { 
        pais: countryCode, 
        moneda: currency, 
        plan: planId, 
        total: result.total 
      },
      prioridad: 'media'
    });

    return result;
  },

  format(value) {
    return Number(value.toFixed(2));
  },

  /**
   * Intenta detectar el país del visitante (Placeholder)
   */
  detectCountry() {
    // En producción se usaría la IP del cliente o el locale del navegador
    return 'PE'; 
  }
};
