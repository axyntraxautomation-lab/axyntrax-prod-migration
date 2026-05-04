const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const {
  WHATSAPP_TOKEN,
  META_VERIFY_TOKEN = 'axyntrax2026',
  PHONE_NUMBER_ID = '1156622220859055',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Webhook Verification (GET /api)
app.get('/api', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('Webhook verificado ✅');
    return res.status(200).set('Content-Type', 'text/plain').send(challenge);
  }
  res.sendStatus(403);
});

// Message Handling (POST /api) - WhatsApp/FB/IG
app.post('/api', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message?.type === 'text') {
      const from = message.from;
      const text = message.text.body;
      console.log(`Mensaje WA de ${from}: ${text}`);

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Eres Cecilia IA de Axyntrax Automation. Responde en español de forma profesional y servicial.
      Ayuda al cliente con sus dudas sobre automatización, planes (Trial, Basic, Pro, Enterprise) y rubros.
      Cliente dice: ${text}`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      await axios.post(
        `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: from,
          type: 'text',
          text: { body: responseText }
        },
        {
          headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
        }
      );
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error Meta API:', error.response?.data || error.message);
    res.sendStatus(200); // Always respond 200 to Meta
  }
});

// CECILIA WEB CHAT (POST /api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, visitorId, rubro } = req.body;
    console.log(`Chat Web [${visitorId}]: ${message}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Eres Cecilia WEB de Axyntrax Automation. Eres un chatbot embebido en la web.
    DATOS DEL SITIO:
    - Planes: Trial (45 días gratis), Basic, Pro, Enterprise.
    - Rubros: Taller, Veterinaria, Dentista, Clínica, Retail, Restaurante, Logística, Transporte.
    - Cecilia atiende WA/FB/IG 24/7. ATLAS es soporte. JARVIS es el dashboard.
    - No inventes precios exactos si no los tienes, invita a solicitar demo.
    Visitor ID: ${visitorId}
    Rubro: ${rubro || 'No especificado'}
    Mensaje: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ error: "No pude procesar tu mensaje ahora." });
  }
});

// LOG EVENT (JARVIS RECEIVER)
app.post('/api/log-event', async (req, res) => {
  try {
    const event = req.body;
    console.log('EVENTO JARVIS:', JSON.stringify(event));
    
    // Log to Supabase for persistence
    await supabase.from('audit_logs').insert([{
      event_type: event.evento,
      details: event,
      created_at: new Date().toISOString()
    }]);

    res.json({ status: 'logged' });
  } catch (error) {
    console.error('Log Event Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Registration Handling (POST /api/registro-demo)
app.post('/api/registro-demo', async (req, res) => {
  try {
    const { nombre, whatsapp, email, empresa, rubro, acepta_terminos, acepta_marketing, timestamp_consentimiento, version_terminos } = req.body;
    
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

    if (error) throw error;
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error Registration:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    app: 'AXYNTRAX PROD MIGRATION',
    status: 'ONLINE',
    supabase: !!supabase,
    gemini: !!genAI,
    ts: new Date().toISOString()
  });
});

module.exports = app;
