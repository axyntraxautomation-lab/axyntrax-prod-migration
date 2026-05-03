const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const {
  WHATSAPP_TOKEN,
  META_VERIFY_TOKEN = 'robotcito',
  PHONE_NUMBER_ID = '1156622220859055'
} = process.env;

// Webhook Verification (GET /api)
app.get('/api', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('Webhook verificado ✅');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Message Handling (POST /api)
app.post('/api', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message?.type === 'text') {
      const from = message.from;
      const text = message.text.body;

      console.log(`Mensaje de ${from}: ${text}`);

      // Auto-reply
      await axios.post(
        `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: from,
          type: 'text',
          text: { body: `¡Hola! Soy Cecilia Asist. He recibido tu mensaje: ${text}` }
        },
        {
          headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
        }
      );
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error Meta API:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

module.exports = app;
