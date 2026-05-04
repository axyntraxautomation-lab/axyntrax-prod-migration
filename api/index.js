const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());

const {
  WHATSAPP_TOKEN,
  META_VERIFY_TOKEN = 'axyntrax2026',
  PHONE_NUMBER_ID = '1156622220859055',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
          text: { body: `¡Hola! Soy Cecilia Asist. He recibido tu mensaje: ${text}. Pronto te daré una respuesta detallada. 🤖` }
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

// Registration Handling (POST /api/registro-demo)
app.post('/api/registro-demo', async (req, res) => {
  try {
    const { nombre, whatsapp, email, empresa, rubro, acepta_terminos, acepta_marketing, timestamp_consentimiento, version_terminos } = req.body;
    
    console.log(`Nuevo registro demo: ${nombre} (${empresa})`);

    const { data, error } = await supabase
      .from('demo_registrations')
      .insert([{
        nombre,
        whatsapp,
        email,
        empresa,
        rubro,
        acepta_terminos,
        acepta_marketing,
        timestamp_consentimiento,
        version_terminos,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error saving to Supabase:', error.message);
      // Even if it fails to save, we might want to return 200 if we have other ways to track it
      // but for now, let's return 500
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ status: 'ok', message: 'Registro exitoso' });
  } catch (error) {
    console.error('Error in /api/registro-demo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    app: 'AXYNTRAX PROD MIGRATION',
    status: 'ONLINE',
    supabase: !!supabase,
    ts: new Date().toISOString()
  });
});

module.exports = app;
