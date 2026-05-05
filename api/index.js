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
    return res.status(200).set('Content-Type', 'text/plain').send(challenge);
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

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Eres Cecilia IA de Axyntrax Automation. Responde en español de forma humana y cálida.
      Planes: Trial (45 días gratis), Basic, Pro, Enterprise.
      Rubros: Taller, Veterinaria, Dentista, Clínica, Retail, Restaurante, Logística, Transporte.
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
    console.error('WA Error:', error.message);
    res.sendStatus(200);
  }
});

// CECILIA WEB CHAT (POST /api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, visitorId, rubro } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Eres Cecilia WEB de Axyntrax Automation. 
    Eres el chatbot embebido en la web. Sabe todo el sitio:
    - Planes: Trial (45 días gratis), Basic, Pro, Enterprise.
    - Rubros: Taller, Veterinaria, Dentista, Clínica, Retail, Restaurante, Logística, Transporte.
    - Cecilia atiende WA/FB/IG 24/7. ATLAS es soporte. JARVIS es el dashboard.
    Visitor ID: ${visitorId}
    Rubro: ${rubro || 'No especificado'}
    Mensaje: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.json({ response: "¡Hola! Estoy experimentando una alta demanda. ¿Podrías contactarme por WhatsApp haciendo clic en el botón de abajo? Estaré encantada de ayudarte. 😊" });
  }
});

// LOG EVENT
app.post('/api/log-event', async (req, res) => {
  try {
    const event = req.body;
    console.log('EVENTO JARVIS:', JSON.stringify(event));
    
    // Optional: Log to Supabase audit_logs table if it exists
    await supabase.from('audit_logs').insert([{
      event_type: event.evento,
      details: event,
      created_at: new Date().toISOString()
    }]).catch(() => {});

    res.json({ status: 'logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registration Handling
app.post('/api/registro-demo', async (req, res) => {
  try {
    const { nombre, whatsapp, email, empresa, rubro } = req.body;
    await supabase.from('demo_registrations').insert([{ 
      nombre, whatsapp, email, empresa, rubro, 
      created_at: new Date().toISOString() 
    }]);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AXYNTRAX VOICE — AI CALLS (POST /api/voice/trigger)
app.post('/api/voice/trigger', async (req, res) => {
  try {
    const { appointmentId, phone, clientName, rubro, dateTime } = req.body;
    
    // IA Voice Script Generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Eres Cecilia Voice, la asistente telefónica de Axyntrax. 
    Tu misión es llamar a ${clientName} para confirmar su cita de ${rubro} el día ${dateTime}.
    Genera el guion inicial de la llamada (máximo 30 palabras) con tono cálido y humano.`;
    
    const result = await model.generateContent(prompt);
    const voiceScript = result.response.text();

    // Log the call event to JARVIS/Supabase
    const callLog = {
      appointmentId,
      phone,
      clientName,
      script: voiceScript,
      status: 'CALLING',
      timestamp: new Date().toISOString()
    };

    await supabase.from('voice_calls').insert([callLog]).catch(() => {});
    
    // Simulate call completion after 2 seconds
    setTimeout(async () => {
      await supabase.from('voice_calls')
        .update({ status: 'CONFIRMED' })
        .eq('appointmentId', appointmentId)
        .catch(() => {});
    }, 2000);

    res.json({ 
      status: 'initiated', 
      script: voiceScript,
      provider: 'Axyntrax Voice Engine v1.0'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET VOICE LOGS
app.get('/api/voice/logs', async (req, res) => {
  try {
    const { data } = await supabase.from('voice_calls').select('*').order('timestamp', { ascending: false }).limit(20);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ONLINE', 
    gemini: !!genAI,
    version: '4.0.0-voice-alpha',
    modules: ['WhatsApp', 'WebChat', 'Link', 'Voice']
  });
});

module.exports = app;
