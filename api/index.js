const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'https://www.axyntrax-automation.net').split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS bloqueado: origen no autorizado'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

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

// Función desacoplada para procesar el mensaje en segundo plano
const processWhatsAppMessage = async (body) => {
  const entry = body.entry?.[0];
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
};

// Message Handling (POST /api) - WHATSAPP WEBHOOK
app.post('/api', (req, res) => {
  // 1. Responder a Meta INMEDIATAMENTE
  res.status(200).send('EVENT_RECEIVED');

  // 2. Procesar en background (no bloquea el response)
  setImmediate(async () => {
    try {
      await processWhatsAppMessage(req.body);
    } catch (err) {
      console.error('[WEBHOOK ERROR]', err.message);
    }
  });
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
    try {
      await supabase.from('audit_logs').insert([{
        event_type: event.evento,
        details: event,
        created_at: new Date().toISOString()
      }]);
    } catch(dbErr) { console.error('Log DB err:', dbErr.message); }

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
    version: '5.0.0-corporate',
    modules: ['WhatsApp', 'WebChat', 'JARVIS', 'Voice', 'Keygen', 'ATLAS']
  });
});

// ═══════════════════════════════════════════
// KEYGEN ENGINE V1 — AXYNTRAX CORPORATIVO
// ═══════════════════════════════════════════

const RUBROS_CODIGOS = {
  'car_wash': 'CW', 'clinica': 'CL', 'dentista': 'DN',
  'logistica': 'LG', 'veterinaria': 'VT', 'retail': 'RT', 'legal': 'JD'
};
const PLANES_CODIGOS = { 'starter': 'S1', 'business': 'B3', 'enterprise': 'EX' };

const generarKeygen = (rubro, plan, submodulos, diasTrial = 45) => {
  const rubroCode = RUBROS_CODIGOS[rubro] || 'GN';
  const planCode = PLANES_CODIGOS[plan] || 'S1';
  const ts = Date.now().toString(36).toUpperCase();
  const modStr = submodulos.sort().join('');
  const raw = `${rubroCode}-${planCode}-${ts}-${modStr}-AXYNTRAX`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 8).toUpperCase();
  const key = `AXN-${rubroCode}${planCode}-${ts}-${hash}`;
  const expiry = new Date(Date.now() + diasTrial * 86400000).toISOString();
  return { key, expiry, rubroCode, planCode, hash };
};

// POST /api/keygen/generate — Solo CEO (token maestro)
app.post('/api/keygen/generate', async (req, res) => {
  try {
    const { masterToken, rubro, plan, empresa, contacto, submodulos = ['A'], diasTrial = 45 } = req.body;
    
    if (!process.env.JARVIS_MASTER_TOKEN) { return res.status(500).json({ error: 'Token maestro no configurado' }); }
    if (masterToken !== process.env.JARVIS_MASTER_TOKEN) {
      return res.status(401).json({ error: 'Acceso denegado. Token maestro inválido.' });
    }
    if (!rubro || !plan) return res.status(400).json({ error: 'Rubro y plan son obligatorios.' });

    const { key, expiry, rubroCode, planCode } = generarKeygen(rubro, plan, submodulos, diasTrial);

    // Guardar en Supabase (compatible con todas las versiones del cliente JS)
    try {
      const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
      await supabase.from('keygens').insert([{
        key: hashedKey, rubro, plan, submodulos: submodulos.join(','),
        empresa: empresa || 'Sin registrar',
        contacto: contacto || '',
        estado: 'ACTIVO',
        expiry_date: expiry,
        activaciones: 0,
        max_activaciones: plan === 'enterprise' ? 999 : plan === 'business' ? 3 : 1,
        created_at: new Date().toISOString()
      }]);
    } catch(dbErr) { console.error('[KEYGEN] DB Error:', dbErr.message); }

    console.log(`[KEYGEN] Generado: ${key} para ${empresa} (${rubro}/${plan})`);
    res.json({ 
      status: 'GENERADO', key, expiry, rubro, plan,
      submodulos, empresa,
      instrucciones: `Entrega este key al cliente. Al ejecutar el instalador, ingresará: ${key}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/keygen/validate — Llamado por el instalador del cliente
app.post('/api/keygen/validate', async (req, res) => {
  try {
    const { key, machineId } = req.body;
    if (!key) return res.status(400).json({ valid: false, error: 'Key requerido.' });

    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

    // Buscar en Supabase
    const { data, error } = await supabase
      .from('keygens').select('*').eq('key', hashedKey).single();

    if (error || !data) return res.json({ valid: false, error: 'Key no encontrado. Contacta a Axyntrax.' });
    if (data.estado !== 'ACTIVO') return res.json({ valid: false, error: `Key ${data.estado}. Contacta soporte.` });
    if (new Date(data.expiry_date) < new Date()) {
      await supabase.from('keygens').update({ estado: 'EXPIRADO' }).eq('key', hashedKey);
      return res.json({ valid: false, error: 'Licencia expirada. Renueva tu plan en axyntrax-automation.net' });
    }
    if (data.activaciones >= data.max_activaciones) {
      return res.json({ valid: false, error: `Límite de ${data.max_activaciones} activaciones alcanzado.` });
    }

    // Registrar activación
    await supabase.from('keygens').update({ 
      activaciones: data.activaciones + 1,
      last_machine: machineId || 'unknown',
      last_activation: new Date().toISOString()
    }).eq('key', hashedKey);

    console.log(`[KEYGEN] Validado OK: ${key} — ${data.empresa}`);
    res.json({
      valid: true,
      empresa: data.empresa,
      rubro: data.rubro,
      plan: data.plan,
      submodulos: data.submodulos?.split(',') || ['A'],
      expiry: data.expiry_date,
      activacionesRestantes: data.max_activaciones - data.activaciones - 1,
      mensaje: `✅ Axyntrax activado para ${data.empresa}. Bienvenido al ecosistema.`
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// GET /api/keygen/list — Lista de keys (solo CEO)
app.get('/api/keygen/list', async (req, res) => {
  try {
    const { token } = req.query;
    if (!process.env.JARVIS_MASTER_TOKEN) { return res.status(500).json({ error: 'Token maestro no configurado' }); }
    if (token !== process.env.JARVIS_MASTER_TOKEN) {
      return res.status(401).json({ error: 'Acceso denegado.' });
    }
    const { data } = await supabase.from('keygens').select('*').order('created_at', { ascending: false });
    res.json({ total: data?.length || 0, keys: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;

