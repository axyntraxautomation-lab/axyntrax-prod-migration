const router = require('express').Router();
const verifyMeta = require('../middleware/verifyMeta');
router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) { console.log('FB OK'); return res.status(200).send(challenge); }
  res.sendStatus(403);
});
router.post('/', verifyMeta, async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'page') return;
    for (const entry of body.entry || []) {
      for (const ev of entry.messaging || []) {
        if (!ev.message?.text || ev.message.is_echo) continue;
        const psid = ev.sender.id, text = ev.message.text.trim();
        console.log('FB de ' + psid + ': ' + text.slice(0,60));
        const axios = require('axios');
        let respuesta = 'Hola! Soy Cecilia de AxyntraX. Demo GRATIS: axyntrax-automation.net
';
        if (process.env.GEMINI_API_KEY) {
          try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const r = await new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent('Eres Cecilia IA de AxyntraX Automation Peru. Responde en espanol. Termina con: Demo GRATIS: axyntrax-automation.net
\nCliente: ' + text + '\nCecilia:');
            respuesta = r.response.text();
          } catch(e) { console.error('Gemini FB err:', e.message); }
        }
        if (process.env.META_PAGE_ACCESS_TOKEN) {
          await axios.post('https://graph.facebook.com/v19.0/me/messages',
            { recipient: { id: psid }, message: { text: respuesta } },
            { headers: { Authorization: 'Bearer ' + process.env.META_PAGE_ACCESS_TOKEN } }
          ).catch(e => console.error('FB send err:', e.response?.data?.error?.message || e.message));
        }
      }
    }
  } catch(e) { console.error('FB err:', e.message); }
});
module.exports = router;
