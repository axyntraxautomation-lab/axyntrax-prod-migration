/**
 * AXYNTRAX — Guardián de Uptime (Self-Healing Watchdog)
 * GET /api/guardian
 * Auto-diagnostica y degrada el servicio si detecta fallos
 */

// ── Estado compartido del sistema ──────────────────────────────
const SystemState = {
  mode: 'full',           // 'full' | 'basic' | 'emergency'
  errors: [],
  cache: new Map(),
  lastReset: Date.now(),
  requestsLastMin: 0,
  memWarnings: 0,
};

// ── Límites de auto-curación ────────────────────────────────────
const THRESHOLDS = {
  maxMemMB:          380,   // Si RAM > 380MB → degradar
  maxErrorsPerMin:   10,    // Si errores > 10/min → modo basic
  maxRequestsPerMin: 200,   // Si req > 200/min → modo emergency
  cacheMaxSize:      500,   // Limpiar caché si supera 500 entradas
};

// ── Log de errores ──────────────────────────────────────────────
const ERROR_LOG = [];

function logError(type, detail) {
  ERROR_LOG.push({ type, detail, ts: new Date().toISOString() });
  if (ERROR_LOG.length > 100) ERROR_LOG.shift(); // rolling buffer
}

// ── Auto-curación: limpia caché ─────────────────────────────────
function clearCache() {
  const before = SystemState.cache.size;
  SystemState.cache.clear();
  SystemState.lastReset = Date.now();
  console.log(`[GUARDIAN ✅] Caché limpiada: ${before} entradas eliminadas.`);
  return before;
}

// ── Diagnóstico de memoria ──────────────────────────────────────
function checkMemory() {
  const mem   = process.memoryUsage();
  const memMB = Math.round(mem.rss / 1024 / 1024);
  if (memMB > THRESHOLDS.maxMemMB) {
    SystemState.memWarnings++;
    logError('MEMORY_HIGH', `${memMB}MB en uso`);
    if (SystemState.memWarnings >= 3) {
      SystemState.mode = 'basic';
      clearCache();
      SystemState.memWarnings = 0;
      console.log('[GUARDIAN ⚠️] Modo BÁSICO activado por presión de memoria.');
    }
    return { ok: false, memMB };
  }
  SystemState.memWarnings = 0;
  return { ok: true, memMB };
}

// ── Análisis de logs del chat ───────────────────────────────────
function analyzeChatLogs(logs = []) {
  if (!logs.length) return null;

  const intents    = {};
  const hotLeads   = logs.filter(l => l.score === 'hot');
  const warmLeads  = logs.filter(l => l.score === 'warm');
  logs.forEach(l => { intents[l.intent] = (intents[l.intent] || 0) + 1; });

  const topIntent  = Object.entries(intents).sort((a, b) => b[1] - a[1])[0];

  return {
    generatedAt:   new Date().toISOString(),
    totalSessions: logs.length,
    hotLeads:      hotLeads.length,
    warmLeads:     warmLeads.length,
    conversionEst: Math.round(hotLeads.length * 0.35),
    topIntent:     topIntent ? topIntent[0] : 'N/A',
    pros: [
      hotLeads.length > 0 ? `${hotLeads.length} leads calientes listos para seguimiento` : null,
      topIntent ? `Interés principal detectado: "${topIntent[0]}" (${topIntent[1]} consultas)` : null,
      `Tasa de calificación: ${logs.length ? Math.round((hotLeads.length / logs.length) * 100) : 0}%`,
    ].filter(Boolean),
    cons: [
      warmLeads.length > hotLeads.length ? `${warmLeads.length} leads tibios sin convertir aún` : null,
      logs.filter(l => l.intent === 'general').length > 3 ? 'Varios usuarios sin vertical detectada — mejorar onboarding' : null,
      logs.length < 5 ? 'Tráfico bajo — considerar activar campañas' : null,
    ].filter(Boolean),
    recommendation: hotLeads.length > 2
      ? '🔥 Acción urgente: contactar los leads calientes en las próximas 2 horas para maximizar conversión.'
      : '📩 Activar seguimiento por email/WhatsApp a todos los leads warm.',
  };
}

// ── Handler ─────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST') {
    // Recibe errores de otros endpoints
    const { type, detail } = req.body || {};
    if (type) {
      logError(type, detail);

      if (type === 'USAGE_LIMIT') {
        SystemState.mode = 'basic';
        clearCache();
        return res.status(200).json({ action: 'degraded_to_basic', message: 'Modo básico activado por Usage Limit.' });
      }
      if (type === 'MEMORY_LEAK') {
        const cleared = clearCache();
        return res.status(200).json({ action: 'cache_cleared', entriesRemoved: cleared });
      }
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  // Diagnóstico completo
  const memCheck = checkMemory();

  // Análisis de logs del chat (importado dinámicamente)
  let chatAnalysis = null;
  try {
    // Intenta obtener logs del endpoint de chat
    const { default: axios } = await import('axios');
    const baseUrl = `https://${req.headers.host}`;
    const chatData = await axios.get(`${baseUrl}/api/chat-web`, { timeout: 3000 });
    chatAnalysis = analyzeChatLogs(chatData.data?.leads || []);
  } catch {
    chatAnalysis = { note: 'Chat logs no disponibles en este entorno' };
  }

  // Auto-restaurar a full si la memoria está bien
  if (memCheck.ok && SystemState.mode === 'basic' && ERROR_LOG.filter(e => {
    return Date.now() - new Date(e.ts).getTime() < 300_000;
  }).length === 0) {
    SystemState.mode = 'full';
    console.log('[GUARDIAN ✅] Sistema restaurado a modo FULL.');
  }

  return res.status(200).json({
    guardian:     'AXYNTRAX Watchdog v2.3',
    systemMode:   SystemState.mode,
    memory:       memCheck,
    cacheSize:    SystemState.cache.size,
    lastReset:    new Date(SystemState.lastReset).toISOString(),
    recentErrors: ERROR_LOG.slice(-10),
    thresholds:   THRESHOLDS,
    chatAnalysis,
    timestamp:    new Date().toISOString(),
  });
};

// Exportar estado para uso en otros módulos
module.exports.SystemState = SystemState;
module.exports.logError    = logError;
module.exports.clearCache  = clearCache;
