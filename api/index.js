const { parse } = require('url');

module.exports = async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  // --- HEALTH CHECK ---
  if (pathname === '/api/health') {
    return res.status(200).json({
      ok: true,
      service: "axyntrax-vercel-api",
      ts: new Date().toISOString(),
      version: "3.2.0"
    });
  }

  // --- WHATSAPP WEBHOOK ---
  if (pathname === '/api/whatsapp' || pathname === '/api/webhook') {
    if (req.method === 'GET') {
      if (mode === 'subscribe' && token === (process.env.WH_VERIFY_TOKEN || 'axyntrax_diamante_2026')) {
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Forbidden');
    }
    if (req.method === 'POST') {
      // Aquí se conectaría con la lógica de Cecilia (Python) si fuera un servidor real,
      // pero en Vercel (Serverless) se suele usar una API de reenvío o lógica directa.
      console.log('WhatsApp Webhook POST received');
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  // --- MESSENGER WEBHOOK ---
  if (pathname === '/api/messenger') {
    if (req.method === 'GET') {
      if (mode === 'subscribe' && token === (process.env.WH_VERIFY_TOKEN || 'axyntrax_diamante_2026')) {
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Forbidden');
    }
    if (req.method === 'POST') {
      console.log('Messenger Webhook POST received');
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  res.status(404).send('Not Found');
};
