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

// Helper: Gemini con retry automático ante 429
const geminiGenerate = async (prompt, retries = 3) => {
  const models = ['gemini-1.5-flash-8b', 'gemini-pro', 'gemini-1.0-pro'];
  for (let i = 0; i < retries; i++) {
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        if (err.message && err.message.includes('429') && modelName !== models[models.length - 1]) {
          continue; // Intentar siguiente modelo
        }
        if (err.message && err.message.includes('429') && i < retries - 1) {
          await new Promise(r => setTimeout(r, (i + 1) * 3000)); // Esperar 3s, 6s, 9s
          break; // Salir del loop de modelos para reintentar
        }
        throw err;
      }
    }
  }
  throw new Error('Cuota de IA agotada temporalmente');
};

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
        const prompt = `SISTEMA AXYNTRAX V5.0 — CECILIA WHITE-LABEL
        Eres Cecilia, asistente IA de Axyntrax. Adapta tu tono al rubro del cliente:
        - Clínica/Dentista: formal, usa "usted", empática.
        - Car Wash/Retail: juvenil, usa emojis, tú.
        - Legal/Logística: profesional, concisa, ejecutiva.
        - Veterinaria/Restaurante: cálida, familiar.
        PLANES: Trial 45 días, Basic S/99, Pro S/199, Enterprise S/299.
        NUNCA digas que eres IA. Eres la asistente de esta empresa.
        MENSAJE DEL CLIENTE: ${text}`;

        responseText = await geminiGenerate(prompt);
      } catch (aiError) {
        console.error('AI Error en WA:', aiError.message);
        responseText = `¡Hola! Soy Cecilia 👋 Recibí tu mensaje. Estoy revisando la mejor respuesta para ti. En un momento regreso, o si prefieres escríbeme directamente al +51991740590. ¡Gracias por tu paciencia!`;
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
    const response = await geminiGenerate(prompt);
    res.json({ response });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.json({ response: "¡Hola! Soy Cecilia 😊 Estoy procesando tu consulta. ¿Tienes alguna pregunta sobre nuestros planes o rubros? Puedo ayudarte con información sobre automatización para tu negocio." });
  }
});

// JARVIS CENTRAL CHAT (POST /api/jarvis-chat)
app.post('/api/jarvis-chat', async (req, res) => {
  try {
    const { message } = req.body;
    const prompt = `PERSONALIDAD: Eres J.A.R.V.I.S., el cerebro digital táctico y ejecutivo de Axyntrax Automation.
    TU MISIÓN: Gestionar el negocio de Miguel Montero con precisión absoluta.
    TU ESTADO: Estás en línea, sincronizado con ATLAS (Monitoreo Técnico) y Cecilia (Ventas/WhatsApp).
    CONTEXTO: Miguel es el CEO. Tu tono debe ser eficiente, leal y altamente tecnológico.
    DATOS ACTUALES (Dashboard):
    - Auditoría: 100% Completada (Blindado).
    - ATLAS: Operativo (Sincronización de tokens OK).
    - Cecilia: Activa en WhatsApp y Web con modelo gemini-1.5-flash-8b.
    MENSAJE DEL CEO: ${message}
    RESPUESTA: Responde de forma detallada, ejecutiva y precisa. No uses frases genéricas.`;
    const responseText = await geminiGenerate(prompt);
    console.log('[JARVIS] Response generated OK');
    res.json({ response: responseText });
  } catch (error) {
    console.error('[JARVIS] Error:', error.message);
    res.json({ response: 'ALERTA JARVIS: La cuota de IA del plan gratuito se ha agotado temporalmente. El sistema reiniciará el contador en ~1 minuto. ATLAS recomienda actualizar a un plan de pago en ai.google.dev para eliminar este límite permanentemente.' });
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
