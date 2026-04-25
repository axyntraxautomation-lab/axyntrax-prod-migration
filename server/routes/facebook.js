const router = require('express').Router();
const verifyMeta = require('../middleware/verifyMeta');
const { sendMetaMsg } = require('../services/metaSender');
const cecilia = require('../services/cecilia');
const { upsertClient, saveMsg } = require('../services/supabase');

router.get('/', (req, res) => {
  const { 'hub.mode':mode, 'hub.verify_token':token, 'hub.challenge':challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

router.post('/', verifyMeta, async (req, res) => {
  res.sendStatus(200);
  try {
    const messaging = req.body?.entry?.[0]?.messaging?.[0];
    if (!messaging?.message?.text || messaging.message.is_echo) return;
    const psid = messaging.sender.id, text = messaging.message.text;
    console.log('FB de ' + psid + ': ' + text);
    const cliente = await upsertClient({ psid_fb:psid, canal:'facebook' });
    await saveMsg({ client_id:cliente.id, canal:'facebook', mensaje:text, agente:'USER' });
    const respuesta = await cecilia.responder(text, cliente);
    await sendMetaMsg(psid, respuesta);
    await saveMsg({ client_id:cliente.id, canal:'facebook', respuesta, agente:'CECILIA' });
  } catch(e) { console.error('FB error:', e.message); }
});
module.exports = router;
