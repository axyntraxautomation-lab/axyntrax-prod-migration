/**
 * AXYNTRAX — Endpoint de Salud del Sistema
 * GET /api/health
 * Verifica: API, Gemini, WhatsApp, memoria
 */

const GEMINI_KEY  = process.env.GEMINI_API_KEY    || 'mock_gemini_123';
const WSP_TOKEN   = process.env.META_ACCESS_TOKEN || 'mock_token_123';
const IS_MOCK     = GEMINI_KEY === 'mock_gemini_123';

const startTime   = Date.now();
let   requestCount = 0;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();

  requestCount++;
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const mem    = process.memoryUsage();
  const memMB  = Math.round(mem.rss / 1024 / 1024);

  // ── Checks ───────────────────────────────────────────────────
  const checks = {
    api:       { status: 'ok',     latency: 0 },
    gemini:    { status: IS_MOCK ? 'mock' : 'pending', latency: null },
    whatsapp:  { status: WSP_TOKEN === 'mock_token_123' ? 'mock' : 'pending', latency: null },
    memory:    { status: memMB < 400 ? 'ok' : 'warning', usedMB: memMB },
  };

  // Verifica Gemini real si hay clave
  if (!IS_MOCK) {
    const t0 = Date.now();
    try {
      const { default: axios } = await import('axios');
      await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`,
        { timeout: 4000 }
      );
      checks.gemini = { status: 'ok', latency: Date.now() - t0 };
    } catch (e) {
      checks.gemini = { status: 'error', error: e.message, latency: Date.now() - t0 };
    }
  }

  // Estado global
  const allOk    = Object.values(checks).every(c => ['ok','mock'].includes(c.status));
  const hasWarn  = Object.values(checks).some(c => c.status === 'warning');
  const overall  = allOk ? 'healthy' : hasWarn ? 'degraded' : 'critical';

  const payload = {
    status:    overall,
    mode:      IS_MOCK ? 'simulation' : 'production',
    version:   '2.3.0',
    uptime:    `${uptime}s`,
    requests:  requestCount,
    timestamp: new Date().toISOString(),
    checks,
    deployment: {
      platform: 'vercel',
      domain:   'axyntrax-automation.com',
      region:   process.env.VERCEL_REGION || 'iad1'
    }
  };

  const httpStatus = overall === 'critical' ? 503 : 200;
  return res.status(httpStatus).json(payload);
};
