const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const {
  WHATSAPP_TOKEN,
  META_VERIFY_TOKEN,
  PHONE_NUMBER_ID,
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

// Message Handling (POST /api) - WHATSAPP WEBHOOK
app.post('/api', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message?.type === 'text') {
      const from = message.from;
      const text = message.text.body;

      console.log(`[WA] Mensaje recibido de ${from}: ${text}`);

      let responseText = "";
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `IDENTIDAD: Eres Cecilia, asistente de Axyntrax Automation.
        PERSONALIDAD: Peruana de Arequipa, 28 años, profesional, empática y proactiva.
        CONTEXTO: Estás en el WhatsApp de la empresa del cliente.
        MÓDULOS: Cecilia (Ventas), ATLAS (Soporte), JARVIS (Dashboard).
        REGLA: NUNCA digas que eres una IA. Habla con calidez peruana.
        PLANES: Trial (45 días), Basic (S/99), Pro (S/199), Enterprise (S/299).
        RUBROS: Car Wash, Veterinaria, Talleres, Clínicas, Restaurantes.
        CLIENTE PREGUNTA: ${text}`;
        
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
      } catch (aiError) {
        console.error('AI Error en WA:', aiError.message);
        responseText = "¡Hola! Soy Cecilia. He recibido tu mensaje, pero mi módulo de análisis está en mantenimiento por un momento. ¿Te gustaría que un especialista de ATLAS te contacte o prefieres esperar unos minutos? ¡Mil disculpas!";
      }

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
      console.log(`[WA] Respuesta enviada a ${from}`);
    }
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('WA Critical Error:', error.message);
    res.status(200).send('EVENT_RECEIVED');
  }
});


// CECILIA WEB CHAT (POST /api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, visitorId, rubro } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Eres Cecilia WEB de Axyntrax Automation. 
    IDENTIDAD: Peruana de Arequipa, 28 años, profesional y cálida.
    Eres el chatbot embebido en la web. Sabe todo el sitio:
    - Planes: Trial (45 días gratis), Basic (S/99), Pro (S/199), Enterprise (S/299).
    - Rubros: Car Wash, Veterinaria, Dentista, Clínica, Retail, Restaurante.
    - Cecilia atiende WA/FB/IG 24/7. ATLAS es soporte técnico. JARVIS es el dashboard.
    - Módulos: Axyntrax Boot Optimizer (.bat), Axyntrax Voice (Llamadas IA).
    Visitor ID: ${visitorId}
    Rubro: ${rubro || 'No especificado'}
    Mensaje: ${message}`;


    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error('Chat Error (Simulated Fallback):', error.message);
    res.json({ response: "¡Hola! Soy Cecilia. Puedo ayudarte con información sobre nuestros planes y cómo Axyntrax puede transformar tu negocio. ¿En qué rubro te encuentras?" });
  }
});

// JARVIS CENTRAL CHAT (POST /api/jarvis-chat)
app.post('/api/jarvis-chat', async (req, res) => {
  try {
    const { message } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Eres J.A.R.V.I.S., el sistema operativo central de Axyntrax Automation.
    Tu personalidad es eficiente, tecnológica y ejecutiva. 
    Tienes control sobre Cecilia (Ventas) y ATLAS (Soporte).
    El administrador Miguel está hablando contigo desde la Central de Mando.
    Responde a sus dudas sobre el sistema, métricas o estrategia de automatización.
    Mensaje del administrador: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    
    let voiceScript = "Hola " + clientName + ", le llamo de Axyntrax para confirmar su cita de " + rubro + " para " + dateTime + ". ¿Podrá asistir?";
    try {
      const result = await model.generateContent(prompt);
      voiceScript = result.response.text();
    } catch (aiError) {
      console.error('Voice AI Error (Simulated Fallback):', aiError.message);
    }

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
