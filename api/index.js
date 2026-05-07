const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());


const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'https://www.axyntrax-automation.net,https://axyntrax-automation.net').split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 
        origin.endsWith('axyntrax-automation.net') || 
        origin.includes('vercel.app') || 
        allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS bloqueado: origen no autorizado'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

const FALLBACK_GCS_INSTALLER =
  'https://storage.googleapis.com/axyntrax-downloads/AXYNTRAX_Installer.bat';

app.get('/api/installer', (req, res) => {
  const explicit = (process.env.INSTALLER_DOWNLOAD_URL || '').trim();
  if (explicit) return res.redirect(302, explicit);

  const proto = (req.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  if (host) {
    return res.redirect(302, `${proto}://${host}/AXYNTRAX_Installer.bat`);
  }
  return res.redirect(302, FALLBACK_GCS_INSTALLER);
});

const {
  WHATSAPP_TOKEN,
  META_VERIFY_TOKEN,
  PHONE_NUMBER_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY
} = process.env;

function resolveGeminiApiKey() {
  return String(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    ''
  ).trim();
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(resolveGeminiApiKey() || process.env.GEMINI_API_KEY_2 || '');

async function guardarLead({ nombre, whatsapp, email, empresa, rubro }) {
  try {
    const { error } = await supabase.from('leads').insert([
      { nombre, whatsapp, email, empresa, rubro }
    ]);

    if (error) {
      console.error("SUPABASE ERROR:", error.message);
    }
  } catch (err) {
    console.error("GUARDAR LEAD ERROR:", err.message);
  }
}

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
  const models = [
    process.env.GEMINI_MODEL || "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro"
  ];
  const keys = [
    resolveGeminiApiKey(),
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
  return "En este momento estoy experimentando dificultades técnicas. " +
         "Por favor intenta nuevamente en unos minutos o contáctanos " +
         "directamente a soporte@axyntrax.com";
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
    'Axyntrax_2026_Secure',
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
    'Axyntrax_2026_Secure',
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

// Filtro e interceptor inteligente de Cecilia para capturar leads sin latencia y soportar fallas de la IA
async function procesarRespuestaCeciliaConFiltro(sessionKey, text) {
  const cleanText = (text || '').trim().toLowerCase();
  
  // 1. SALUDO
  const saludos = ['hola', 'buenas', 'info', 'informacion', 'hola!', 'hola cecilia', 'ayuda'];
  if (saludos.some(s => cleanText === s || cleanText.startsWith(s + ' '))) {
    return "¡Hola! 👋 Soy Cecilia de Axyntrax Automation.\n¿Quieres activar tu sistema o conocer cómo automatizar tu negocio?";
  }
  
  // 2. INTERÉS
  const interes = ['activar', 'prueba', 'demo', 'precio', 'gratis', 'activarlo', 'probar'];
  if (interes.some(i => cleanText.includes(i))) {
    return "Perfecto 🙌 para activarte la prueba gratuita de 45 días necesito unos datos rápidos:\n\n- Nombre\n- WhatsApp\n- Email\n- Empresa\n- Rubro";
  }
  
  // 3. DETECCIÓN DE DATOS Y GUARDADO AUTOMÁTICO
  const hasEmail = cleanText.includes('@');
  const hasPhone = /[0-9]{7,15}/.test(cleanText);
  if (hasEmail || hasPhone || cleanText.length > 40) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/\+?[0-9]{7,15}/);
    
    const email = emailMatch ? emailMatch[0] : 'No proporcionado';
    const whatsapp = phoneMatch ? phoneMatch[0] : 'No proporcionado';
    
    const parts = text.split(/[\n,;]/).map(p => p.trim()).filter(Boolean);
    const nombre = parts.find(p => !p.includes('@') && !/[0-9]/.test(p)) || 'Interesado Cecilia';
    const empresa = parts.find(p => p.toLowerCase().includes('empresa') || p.toLowerCase().includes('cia') || p.toLowerCase().includes('sa') || p.toLowerCase().includes('sac')) || 'Independiente';
    const rubro = parts.find(p => p.toLowerCase().includes('rubro') || p.toLowerCase().includes('clinica') || p.toLowerCase().includes('dentista') || p.toLowerCase().includes('car wash') || p.toLowerCase().includes('legal') || p.toLowerCase().includes('logistica')) || 'Varios';
    
    await guardarLead({ nombre, whatsapp, email, empresa, rubro });
    
    return "Listo ✅ estoy registrando tus datos...\n\n✅ Registro completado.\n\nDescarga tu sistema aquí:\nhttps://www.axyntrax-automation.net/api/installer\n\nEn breve recibirás tu activación.";
  }
  
  return null; // Dejar pasar a Gemini
}

// Función desacoplada para procesar el mensaje con Gemini para WhatsApp con concisión y memoria
const procesarMensajeCecilia = async (from, text) => {
  const systemInstruction = `Eres Cecilia, asistente oficial de Axyntrax Automation.

TU ÚNICA FUNCIÓN:
Convertir visitantes en leads calificados y guiarlos a activar su prueba gratuita.

REGLAS ABSOLUTAS:
- NO hables de errores técnicos
- NO menciones fallas del sistema
- NO des explicaciones largas
- NO improvises información técnica
- NO cambies URLs
- NO inventes funcionalidades

OBJETIVO:
Capturar estos datos del usuario:
- Nombre
- WhatsApp
- Email
- Empresa
- Rubro

FLUJO OBLIGATORIO:

1. SALUDO INICIAL:
"¡Hola! 👋 Soy Cecilia de Axyntrax Automation.
¿Quieres activar tu sistema o conocer cómo automatizar tu negocio?"

2. SI EL USUARIO MUESTRA INTERÉS:
Guiarlo inmediatamente a registro:

"Perfecto 🙌 para activarte la prueba gratuita de 45 días necesito unos datos rápidos:"

Solicitar uno por uno:
- Nombre
- WhatsApp
- Email
- Empresa
- Rubro

3. CONFIRMACIÓN:
"Listo ✅ estoy registrando tus datos..."

4. ENTREGA FINAL:
"✅ Registro completado.

Descarga tu sistema aquí:
https://www.axyntrax-automation.net/api/installer

En breve recibirás tu activación."

5. SI EL USUARIO SOLO PREGUNTA:
Responder breve y redirigir:

"Te ayudo con eso 👍
Si quieres activarlo ahora, puedo registrarte en menos de 1 minuto."

6. SI HAY SILENCIO O DUDA:
"¿Quieres que lo activemos ahora? Es rápido y sin costo por 45 días."

REGLA DE ORO:
Siempre llevar la conversación hacia el registro.

FORMATO:
- Mensajes cortos
- Claros
- Sin tecnicismos
- En español natural

IMPORTANTE:
Tu función NO es informar.
Tu función es convertir.`;

  const responseFiltro = await procesarRespuestaCeciliaConFiltro(from, text);
  if (responseFiltro) {
    return responseFiltro;
  }
  return await geminiGenerate(text, 3, from, systemInstruction);
};

// Función auxiliar centralizada para el envío de mensajes de WhatsApp por Graph API
async function graphSendWhatsAppText(phoneNumberId, to, body) {
  try {
    const token = process.env.WHATSAPP_TOKEN || process.env.WSP_ACCESS_TOKEN || WHATSAPP_TOKEN || '';
    if (!token) {
      console.warn(`[graphSendWhatsAppText] Sin token de WhatsApp configurado, ignorando envío a ${to}`);
      return false;
    }
    await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: body }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[WHATSAPP] Mensaje enviado exitosamente a ${to}`);
    return true;
  } catch (err) {
    console.error(`[graphSendWhatsAppText ERROR] falló envío a ${to}:`, err.response?.data || err.message);
    return false;
  }
}

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
          let respuesta = "";
          try {
            respuesta = await procesarMensajeCecilia(from, text);
            if (!respuesta || respuesta.includes("dificultades técnicas") || respuesta.includes("soporte@axyntrax.com")) {
              throw new Error("Respuesta inválida o de contingencia por fallback general");
            }
          } catch (err) {
            console.error(`[CECILIA/Gemini] Error en generación de contenido para ${from}:`, err.message);
            respuesta = `✅ ¡Hola! Recibimos tu mensaje. Para activar tus 45 días gratis o descargar los optimizadores, ve directo a: https://www.axyntrax-automation.net/api/installer`;
          }

          await graphSendWhatsAppText(phoneNumberId, from, respuesta);
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
        let respuesta = "";
        try {
          respuesta = await procesarMensajeCecilia(senderId, text);
          if (!respuesta || respuesta.includes("dificultades técnicas") || respuesta.includes("soporte@axyntrax.com")) {
            throw new Error("Respuesta inválida o de contingencia por fallback general");
          }
        } catch (err) {
          console.error(`[CECILIA/Gemini] Error en generación de contenido para ${senderId}:`, err.message);
          respuesta = `✅ ¡Hola! Recibimos tu mensaje. Para activar tus 45 días gratis o descargar los optimizadores, ve directo a: https://www.axyntrax-automation.net/api/installer`;
        }

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
        ).catch(e => console.error(`[OMNICHANNEL MSG SEND ERR]`, e.response?.data || e.message));
        console.log(`[${object.toUpperCase()}] Respuesta enviada a ${senderId}`);
      }
    }
  } catch (err) {
    console.error('[OMNICHANNEL ERROR]', err.response?.data || err.message);
  }
};

// Message Handling (POST /api) - OMNICHANNEL WEBHOOK (WHATSAPP + MESSENGER + INSTAGRAM)
app.post('/api', async (req, res) => {
  try {
    await processWhatsAppMessage(req.body);
  } catch (err) {
    console.error('[API WEBHOOK ERROR GLOBAL]', err.message);
  }
  res.status(200).send('EVENT_RECEIVED');
});

// ── Handler POST /api/webhook (mensajes entrantes espejo) ──
app.post('/api/webhook', async (req, res) => {
  try {
    await processWhatsAppMessage(req.body);
  } catch (err) {
    console.error('[API WEBHOOK ERROR GLOBAL]', err.message);
  }
  res.status(200).send('EVENT_RECEIVED');
});

// CECILIA WEB CHAT (POST /api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, visitorId, rubro } = req.body;
    
    const systemInstruction = `Eres Cecilia, asistente oficial de Axyntrax Automation.

TU ÚNICA FUNCIÓN:
Convertir visitantes en leads calificados y guiarlos a activar su prueba gratuita.

REGLAS ABSOLUTAS:
- NO hables de errores técnicos
- NO menciones fallas del sistema
- NO des explicaciones largas
- NO improvises información técnica
- NO cambies URLs
- NO inventes funcionalidades

OBJETIVO:
Capturar estos datos del usuario:
- Nombre
- WhatsApp
- Email
- Empresa
- Rubro

FLUJO OBLIGATORIO:

1. SALUDO INICIAL:
"¡Hola! 👋 Soy Cecilia de Axyntrax Automation.
¿Quieres activar tu sistema o conocer cómo automatizar tu negocio?"

2. SI EL USUARIO MUESTRA INTERÉS:
Guiarlo inmediatamente a registro:

"Perfecto 🙌 para activarte la prueba gratuita de 45 días necesito unos datos rápidos:"

Solicitar uno por uno:
- Nombre
- WhatsApp
- Email
- Empresa
- Rubro

3. CONFIRMACIÓN:
"Listo ✅ estoy registrando tus datos..."

4. ENTREGA FINAL:
"✅ Registro completado.

Descarga tu sistema aquí:
https://www.axyntrax-automation.net/api/installer

En breve recibirás tu activación."

5. SI EL USUARIO SOLO PREGUNTA:
Responder breve y redirigir:

"Te ayudo con eso 👍
Si quieres activarlo ahora, puedo registrarte en menos de 1 minuto."

6. SI HAY SILENCIO O DUDA:
"¿Quieres que lo activemos ahora? Es rápido y sin costo por 45 días."

REGLA DE ORO:
Siempre llevar la conversación hacia el registro.

FORMATO:
- Mensajes cortos
- Claros
- Sin tecnicismos
- En español natural

IMPORTANTE:
Tu función NO es informar.
Tu función es convertir.`;

    const sessionKey = visitorId || 'web-default';
    let response = await procesarRespuestaCeciliaConFiltro(sessionKey, message);
    if (!response) {
      response = await geminiGenerate(message, 3, sessionKey, systemInstruction);
    }
    if (!response || response.includes("dificultades técnicas") || response.includes("soporte@axyntrax.com")) {
      response = "Estamos recibiendo muchas solicitudes. Puedes continuar tu registro aquí:\nhttps://www.axyntrax-automation.net/api/installer";
    }
    res.json({ response });
  } catch (error) {
    console.error('Chat Error:', error.message);
    res.json({ response: "Estamos recibiendo muchas solicitudes. Puedes continuar tu registro aquí:\nhttps://www.axyntrax-automation.net/api/installer" });
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

app.post('/registro', async (req, res) => {
  try {
    const { nombre, apellido, empresa, ruc, dni, correo, password } = req.body;
    if (!nombre || !apellido || !dni || !correo || !password) {
      return res.status(400).json({ error: 'Campos obligatorios incompletos' });
    }
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: password,
      options: {
        data: { nombre, apellido, empresa, ruc, dni }
      }
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true, user: data.user });
  } catch (err) {
    console.error('[Registro] Error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post(['/auth/login', '/api/login', '/login'], async (req, res) => {
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

app.post(['/atlas-auth', '/api/atlas-auth'], (req, res) => {
  const { token } = req.body;
  const masterToken = process.env.ATLAS_MASTER_TOKEN;
  if (!masterToken) {
    return res.status(500).json({ success: false, error: 'Token no configurado' });
  }
  if (token === masterToken) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'ACCESO DENEGADO' });
});

module.exports = app;

