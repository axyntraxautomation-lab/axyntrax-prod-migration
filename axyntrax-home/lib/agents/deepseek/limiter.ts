/**
 * Rate Limiter simple para entornos Serverless (Next.js).
 * Nota: En producción masiva, se recomienda conectar este módulo a Redis (Upstash).
 */

const limits: Record<string, { count: number, reset: number }> = {};

export const checkRateLimit = (channel: string, threshold: number) => {
  const now = Date.now();
  const windowMs = 60000; // 1 minuto

  if (!limits[channel] || now > limits[channel].reset) {
    limits[channel] = { count: 1, reset: now + windowMs };
    return { allowed: true, current: 1 };
  }

  limits[channel].count++;
  
  if (limits[channel].count > threshold) {
    return { allowed: false, current: limits[channel].count };
  }

  // Alerta al 75% del límite
  if (limits[channel].count === Math.floor(threshold * 0.75)) {
    console.warn(`[WARNING] Canal ${channel} al 75% de su capacidad operativa.`);
  }

  return { allowed: true, current: limits[channel].count };
};

export const THRESHOLDS = {
  WEB: 10,
  WSP: 5,
  FB_IG: 7,
  LI: 2,
  GLOBAL: 45
};
