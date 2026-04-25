const router = require('express').Router();
const verifyMeta = require('../middleware/verifyMeta');
router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) { console.log('IG OK'); return res.status(200).send(challenge); }
  res.sendStatus(403);
});
router.post('/', verifyMeta, async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    const axios = require('axios');
    const processIG = async (igsid, text) => {
      console.log('IG de ' + igsid + ': ' + text.slice(0,60));
      let respuesta = 'Hola! Soy Cecilia de AxyntraX. Demo GRATIS: axyntrax-automation.com';
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const r = await new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent('Eres Cecilia IA de AxyntraX Automation Peru. Responde en espanol. Termina con: Demo GRATIS: axyntrax-automation.com\nCliente: ' + text + '\nCecilia:');
          respuesta = r.response.text();
        } catch(e) { console.error('Gemini IG err:', e.message); }
      }
      if (process.env.META_PAGE_ACCESS_TOKEN) {
        await axios.post('https://graph.facebook.com/v19.0/me/messages',
          { recipient: { id: igsid }, message: { text: respuesta } },
          { headers: { Authorization: 'Bearer ' + process.env.META_PAGE_ACCESS_TOKEN } }
        ).catch(e => console.error('IG send err:', e.response?.data?.error?.message || e.message));
      }
    };
    if (body.object === 'instagram') {
      for (const e of body.entry || []) for (const ch of e.changes || []) {
        if (ch.field === 'messages' && ch.value?.sender?.id && ch.value?.message?.text)
          await processIG(ch.value.sender.id, ch.value.message.text.trim());
      }
    }
    if (body.object === 'page') {
      for (const e of body.entry || []) for (const ev of e.messaging || [])
        if (ev.message?.text && !ev.message.is_echo) await processIG(ev.sender.id, ev.message.text.trim());
    }
  } catch(e) { console.error('IG err:', e.message); }
});
module.exports = router;
