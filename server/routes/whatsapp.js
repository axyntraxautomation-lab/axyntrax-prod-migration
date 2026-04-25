const router = require('express').Router();
const verifyMeta = require('../middleware/verifyMeta');
const { sendWhatsApp } = require('../services/metaSender');
const cecilia = require('../services/cecilia');
const { upsertClient, saveMsg } = require('../services/supabase');

router.get('/', (req, res) => {
  const { 'hub.mode':mode, 'hub.verify_token':token, 'hub.challenge':challenge } = req.query;
  console.log('WA verify:', { mode, token });
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

router.post('/', verifyMeta, async (req, res) => {
  res.sendStatus(200);
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.[0]) return;
    const msg = value.messages[0];
    if (msg.type !== 'text') return;
    const from = msg.from, text = msg.text.body;
    console.log('WA de ' + from + ': ' + text);
    const cliente = await upsertClient({ telefono:from, canal:'whatsapp' });
    await saveMsg({ client_id:cliente.id, canal:'whatsapp', mensaje:text, agente:'USER' });
    const respuesta = await cecilia.responder(text, cliente);
    await sendWhatsApp(from, respuesta);
    await saveMsg({ client_id:cliente.id, canal:'whatsapp', respuesta, agente:'CECILIA' });
  } catch(e) { console.error('WA error:', e.message); }
});
module.exports = router;
