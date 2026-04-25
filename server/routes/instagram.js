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
    const body = req.body;
    if (body.object === 'instagram') {
      for (const entry of body.entry||[]) {
        for (const change of entry.changes||[]) {
          if (change.field !== 'messages') continue;
          const val = change.value||{};
          const igsid = val.sender?.id, text = val.message?.text;
          if (!igsid || !text) continue;
          const cliente = await upsertClient({ igsid, canal:'instagram' });
          await saveMsg({ client_id:cliente.id, canal:'instagram', mensaje:text, agente:'USER' });
          const respuesta = await cecilia.responder(text, cliente);
          await sendMetaMsg(igsid, respuesta);
          await saveMsg({ client_id:cliente.id, canal:'instagram', respuesta, agente:'CECILIA' });
        }
      }
    }
    if (body.object === 'page') {
      const messaging = body.entry?.[0]?.messaging?.[0];
      if (messaging?.message?.text && !messaging.message.is_echo) {
        const igsid = messaging.sender.id, text = messaging.message.text;
        const cliente = await upsertClient({ igsid, canal:'instagram' });
        await saveMsg({ client_id:cliente.id, canal:'instagram', mensaje:text, agente:'USER' });
        const respuesta = await cecilia.responder(text, cliente);
        await sendMetaMsg(igsid, respuesta);
        await saveMsg({ client_id:cliente.id, canal:'instagram', respuesta, agente:'CECILIA' });
      }
    }
  } catch(e) { console.error('IG error:', e.message); }
});
module.exports = router;
