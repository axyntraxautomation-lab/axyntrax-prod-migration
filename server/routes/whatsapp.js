const router = require('express').Router();
const verifyMeta = require('../middleware/verifyMeta');
router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  console.log('WA verify token recv:', token, '| expected:', process.env.META_VERIFY_TOKEN);
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) { console.log('WA OK'); return res.status(200).send(challenge); }
  res.sendStatus(403);
});
router.post('/', verifyMeta, async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        for (const msg of change?.value?.messages || []) {
          if (msg.type !== 'text') continue;
          const from = msg.from, text = msg.text?.body?.trim();
          if (!text) continue;
          console.log('WA de ' + from + ': ' + text.slice(0,60));
          const axios = require('axios');
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          let respuesta = 'Hola! Soy Cecilia de AxyntraX Automation. Demo GRATIS: axyntrax-automation.net
 | +51991740590';
          if (process.env.GEMINI_API_KEY) {
            try {
              const r = await model.generateContent('Eres Cecilia, IA de AxyntraX Automation Peru. Responde en espanol. Termina con: Demo GRATIS 30 dias: axyntrax-automation.net
\nCliente: ' + text + '\nCecilia:');
              respuesta = r.response.text();
            } catch(e) { console.error('Gemini err:', e.message); }
          }
          if (process.env.META_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
            await axios.post('https://graph.facebook.com/v19.0/' + process.env.WHATSAPP_PHONE_NUMBER_ID + '/messages',
              { messaging_product: 'whatsapp', to: from, type: 'text', text: { body: respuesta } },
              { headers: { Authorization: 'Bearer ' + process.env.META_ACCESS_TOKEN } }
            ).catch(e => console.error('WA send err:', e.response?.data?.error?.message || e.message));
          }
          console.log('WA respondido a ' + from);
        }
      }
    }
  } catch(e) { console.error('WA err:', e.message); }
});
module.exports = router;
