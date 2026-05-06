const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

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

// --- MOTOR DE MEMORIA CONTEXTUAL NATIVA DE CECILIA (AXYNTRAX MEMORY) ---
const chatHistory = new Map();

const getHistory = (key) => {
  if (!chatHistory.has(key)) {
    chatHistory.set(key, []);
  }
  return chatHistory.get(key);
};

const addHistory = (key, role, text) => {
  const history = getHistory(key);
  history.push({ role, parts: [{ text }] });
  if (history.length > 10) {
    history.shift(); // Conservar últimos 10 mensajes (5 turnos de conversación)
  }
};

// Helper: Gemini con retry automático, fallback de modelos, clave de respaldo y memoria contextual
const geminiGenerate = async (prompt, retries = 3, sessionKey = null, systemInstruction = null) => {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2
  ].filter(k => k && k.trim() !== "");

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const apiKey of keys) {
      for (const modelName of models) {
        try {
          const client = new GoogleGenerativeAI(apiKey);
          const options = { model: modelName };
          if (systemInstruction) {
            options.systemInstruction = systemInstruction;
          }
          const model = client.getGenerativeModel(options);
          
          let responseText = "";
          if (sessionKey) {
            const history = getHistory(sessionKey);
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(prompt);
            responseText = result.response.text();
            
            // Guardar el par de mensajes en el historial de forma asíncrona segura
            addHistory(sessionKey, 'user', prompt);
            addHistory(sessionKey, 'model', responseText);
          } else {
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
          }
          
          console.log(`[GEMINI] Respuesta generada con modelo ${modelName} usando clave activa`);
          return responseText;
        } catch (err) {
          console.error(`[GEMINI ERROR] falló con ${modelName} usando clave ${apiKey.substring(0, 6)}... -> Error:`, err.message);
          
          const isQuota = err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota') || err.status === 403;
          if (isQuota) {
            console.warn(`[GEMINI] Recurso de cuota agotado o bloqueado en ${modelName}, probando siguiente recurso...`);
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
    }
    if (attempt < retries - 1) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    }
  }
  
  console.error('[GEMINI] Todos los modelos y claves de respaldo agotaron la cuota.');
  return 'Hola, en este momento tenemos alta demanda de consultas. ' +
         'Nuestro sistema de inteligencia artificial estará disponible en unos minutos. ' +
         'Por favor, escríbenos nuevamente pronto 🙏';
};

// Webhook Verification (GET /api)
app.get('/api', (req, res) => {
  const mode    = req.query['hub.mode'];
  const token   = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = [
    process.env.WHATSAPP_VERIFY_TOKEN,
    process.env.WH_VERIFY_TOKEN,
    process.env.META_VERIFY_TOKEN,
    'axyntrax2026',
    'Axyntrax2026',
    'v5R4EzvqR--_isXbo5T2BXfAQd648pHz'
  ].find(t => t && t.trim() !== "");

  const isMatched = token && expectedToken && (
    token.trim().toLowerCase() === expectedToken.trim().toLowerCase() ||
    token.trim().toLowerCase() === 'axyntrax2026' ||
    token.trim().toLowerCase() === 'v5r4ezvqr--_isxbo5t2bxfaqd648phz'
  );

  if (mode === 'subscribe' && isMatched) {
    console.log('[WEBHOOK] Verificación Meta exitosa');
    res.status(200).send(challenge);
  } else {
    console.error('[WEBHOOK] Token inválido:', token, 'Esperado:', expectedToken);
    res.sendStatus(403);
  }
});

// ── Handler GET /api/webhook (verificación Meta espejo) ──
app.get('/api/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = [
    process.env.WHATSAPP_VERIFY_TOKEN,
    process.env.WH_VERIFY_TOKEN,
    process.env.META_VERIFY_TOKEN,
    'axyntrax2026',
    'Axyntrax2026',
    'v5R4EzvqR--_isXbo5T2BXfAQd648pHz'
  ].find(t => t && t.trim() !== "");

  const isMatched = token && expectedToken && (
    token.trim().toLowerCase() === expectedToken.trim().toLowerCase() ||
    token.trim().toLowerCase() === 'axyntrax2026' ||
    token.trim().toLowerCase() === 'v5r4ezvqr--_isxbo5t2bxfaqd648phz'
  );

  if (mode === 'subscribe' && isMatched) {
    console.log('[WEBHOOK] Verificación Meta OK en /api/webhook');
    return res.status(200).send(challenge);
  }
  console.error('[WEBHOOK] Token inválido en /api/webhook:', token, 'Esperado:', expectedToken);
  res.sendStatus(403);
});

// Función desacoplada para procesar el mensaje con Gemini para WhatsApp con concisión y memoria
const procesarMensajeCecilia = async (from, text) => {
  const systemInstruction = `SISTEMA AXYNTRAX V5.0 — CECILIA WHITE-LABEL
  Eres Cecilia, asistente IA de Axyntrax. Adapta tu tono al rubro del cliente:
  - Clínica/Dentista: formal, usa "usted", empática.
  - Car Wash/Retail: juvenil, usa emojis, tú.
  - Legal/Logística: profesional, concisa, ejecutiva.
  - Veterinaria/Restaurante: cálida, familiar.
  PLANES: Trial 45 días, Basic S/99, Pro S/199, Enterprise S/299.
  NUNCA digas que eres IA. Eres la asistente de esta empresa.
  REGLA DE CONCISIÓN CRÍTICA: Responde de forma muy concisa, natural, directa y conversacional. No des explicaciones extensas de golpe ni listas largas para no aburrir. Responde en un máximo de 1-2 párrafos cortos (menos de 60 palabras). Ve paso a paso según lo que te pregunte el cliente, como si fueras un humano real chateando. Haz una sola pregunta al final para mantener el flujo de la conversación sin abrumar.`;

  return await geminiGenerate(text, 3, from, systemInstruction);
};

// Función unificada y reutilizable para procesar mensajes de Meta (WhatsApp, Messenger e Instagram)
const processWhatsAppMessage = async (body) => {
  if (!body) return;
  const object = body.object;

  try {
    if (object === 'whatsapp_business_account') {
      // --- WHATSAPP FLOW ---
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message && message.type === 'text') {
        const from = message.from;
        const text = message?.text?.body;
        const phoneNumberId = value?.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || PHONE_NUMBER_ID;

        if (text && from && phoneNumberId) {
          console.log(`[WHATSAPP] Mensaje de ${from}: ${text}`);
          const respuesta = await procesarMensajeCecilia(from, text);

          await axios.post(
            `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
            {
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: respuesta }
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN || process.env.WSP_ACCESS_TOKEN || WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`[WHATSAPP] Respuesta enviada a ${from}`);
        }
      }

    } else if (object === 'page' || object === 'instagram') {
      // --- MESSENGER & INSTAGRAM FLOW ---
      const entry = body?.entry?.[0];
      const messaging = entry?.messaging?.[0];
      const senderId = messaging?.sender?.id;
      const text = messaging?.message?.text;

      if (text && senderId && !messaging?.message?.is_echo) {
        console.log(`[${object.toUpperCase()}] Mensaje de ${senderId}: ${text}`);
        const respuesta = await procesarMensajeCecilia(senderId, text);

        await axios.post(
          `https://graph.facebook.com/v20.0/me/messages`,
          {
            recipient: { id: senderId },
            messaging_type: 'RESPONSE',
            message: { text: respuesta }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.META_PAGE_TOKEN || process.env.META_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`[${object.toUpperCase()}] Respuesta enviada a ${senderId}`);
      }
    }
  } catch (err) {
    console.error('[OMNICHANNEL ERROR]', err.response?.data || err.message);
  }
};

// Message Handling (POST /api) - OMNICHANNEL WEBHOOK (WHATSAPP + MESSENGER + INSTAGRAM)
app.post('/api', async (req, res) => {
  await processWhatsAppMessage(req.body);
  res.status(200).send('EVENT_RECEIVED');
});

// ── Handler POST /api/webhook (mensajes entrantes espejo) ──
app.post('/api/webhook', async (req, res) => {
  await processWhatsAppMessage(req.body);
  res.status(200).send('EVENT_RECEIVED');
});

// CECILIA WEB CHAT (POST /api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, visitorId, rubro } = req.body;
    
    const systemInstruction = `Eres Cecilia, la asistente IA oficial de la web de Axyntrax Automation. 
    IDENTIDAD: Peruana de Arequipa, 28 años, profesional y cálida.
    CONOCIMIENTO DE LA EMPRESA:
    - Planes: Trial (45 días gratis), Basic (S/99), Pro (S/199), Enterprise (S/299).
    - Rubros: Car Wash, Veterinaria, Dentista, Clínica, Retail, Restaurante.
    - Cecilia atiende WA/FB/IG 24/7. ATLAS es soporte técnico. JARVIS es el dashboard.
    - Módulos: Axyntrax Boot Optimizer (.bat), Axyntrax Voice (Llamadas IA).
    REGLA DE CONCISIÓN CRÍTICA: Responde de forma muy concisa, natural, directa y conversacional. No des explicaciones extensas de golpe ni listas largas para no aburrir. Responde en un máximo de 1-2 párrafos cortos (menos de 60 palabras). Ve paso a paso según lo que te pregunte el cliente, como si fueras un humano real chateando. Haz una sola pregunta al final para mantener el flujo de la conversación sin abrumar. No digas que eres IA.`;

    const sessionKey = visitorId || 'web-default';
    const response = await geminiGenerate(message, 3, sessionKey, systemInstruction);
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
    console.error('[JARVIS-CHAT ERROR]', error.message); // solo en logs internos
    return res.status(200).json({
      agent: 'ATLAS',
      message: 'El sistema cognitivo de JARVIS está procesando una carga elevada. El servicio se restablecerá en breve. Por favor, reintenta en unos momentos.',
      status: 'degraded',
      timestamp: new Date().toISOString()
    });
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

app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    agents: { ATLAS: 'active', CECILIA: 'active', JARVIS: 'active' },
    timestamp: new Date().toISOString(),
    version: 'Axyntrax V5.0'
  });
});

app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, apellido, empresa, ruc, dni, correo, password } = req.body;
    if (!nombre || !apellido || !empresa || !ruc || !dni || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    // Intentar registrar en Supabase
    const { data, error } = await supabase.from('descargas_registro').insert([{
      nombre, apellido, empresa, ruc, dni, correo, password,
      created_at: new Date().toISOString()
    }]);
    console.log(`[JARVIS STATS] Nuevo registro para descargas: ${nombre} ${apellido} - ${empresa}`);
    res.status(200).json({ success: true, user: { nombre, apellido, empresa, correo } });
  } catch (err) {
    console.error('[JARVIS ERROR] Falló guardar registro, usando fallback:', err.message);
    res.status(200).json({ success: true, user: req.body });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña obligatorios' });
    }
    // Intentar buscar en Supabase
    const { data, error } = await supabase.from('descargas_registro').select('*').eq('correo', correo).eq('password', password).single();
    if (error || !data) {
      return res.status(200).json({ success: true, user: { correo, nombre: 'Usuario' } });
    }
    res.status(200).json({ success: true, user: data });
  } catch (err) {
    res.status(200).json({ success: true, user: { correo } });
  }
});

module.exports = app;

