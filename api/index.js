const path = require('path');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const app = express();

const INSTALLER_FILENAME = 'AXYNTRAX_Installer.bat';

function localInstallerAbsolutePaths() {
  return [
    path.join(process.cwd(), 'public', INSTALLER_FILENAME),
    path.join(__dirname, '..', 'public', INSTALLER_FILENAME)
  ];
}

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'axyntrax-vercel-api',
    ts: new Date().toISOString()
  });
});

/**
 * Descarga del instalador:
 * 1) INSTALLER_DOWNLOAD_URL (env absoluta)
 * 2) Archivo en public/ — respuesta 200 desde esta función si está en el bundle (vercel.json includeFiles), si no 302 al mismo origen
 * 3) INSTALLER_GCS_PUBLIC_URL (solo si la URL apunta a un objeto que existe; evita NoSuchKey hardcodeado)
 */
app.get('/api/installer', (req, res) => {
  const explicit = (process.env.INSTALLER_DOWNLOAD_URL || '').trim();
  if (explicit) return res.redirect(302, explicit);

  for (const absPath of localInstallerAbsolutePaths()) {
    try {
      if (fs.existsSync(absPath)) {
        const buf = fs.readFileSync(absPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${INSTALLER_FILENAME}"`);
        return res.status(200).send(buf);
      }
    } catch (err) {
      console.error('[installer] lectura local', absPath, err.message);
    }
  }

  const proto = (req.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  if (host) {
    return res.redirect(302, `${proto}://${host}/${INSTALLER_FILENAME}`);
  }

  const gcsPublic = (process.env.INSTALLER_GCS_PUBLIC_URL || '').trim();
  if (gcsPublic) return res.redirect(302, gcsPublic);

  return res.status(503).json({
    ok: false,
    error: 'installer_unavailable',
    hint:
      'Definí INSTALLER_DOWNLOAD_URL o INSTALLER_GCS_PUBLIC_URL en Vercel, o publicá public/AXYNTRAX_Installer.bat en el sitio.'
  });
});

const {
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID = '1156622220859055',
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} = process.env;

/** Clave Gemini/Google AI: prioridad GEMINI_API_KEY (igual que axia_logic.py). Alias comunes en Vercel. */
function resolveGeminiApiKey() {
  return String(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      ''
  ).trim();
}

/**
 * Modelo preferido (Vercel). Si da 404 (nombre/API), se prueba la cascada.
 * En GCP habilitá "Generative Language API" para la clave usada.
 */
function geminiModelCascade() {
  const preferred = String(process.env.GEMINI_MODEL || '').trim();
  const defaults = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-002'
  ];
  const ordered = preferred ? [preferred, ...defaults] : defaults;
  return [...new Set(ordered)];
}

const CECILIA_FALLBACK_WHATSAPP =
  '✅ ¡Hola! Recibimos tu mensaje. Para activar tus 45 días gratis o descargar los optimizadores, ve directo a: https://www.axyntrax-automation.net/api/installer';

async function geminiGenerateContentOnce(userText, key, modelId) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
  const resp = await axios.post(
    url,
    {
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      systemInstruction: {
        parts: [
          {
            text:
              'Eres CECILIA, asistente de Axyntrax Automation (Perú). Respuestas cortas y útiles (máximo 6 líneas). Nunca menciones errores técnicos, APIs, ni "dificultades técnicas".'
          }
        ]
      },
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
    },
    { params: { key }, timeout: 15000, headers: { 'Content-Type': 'application/json' } }
  );

  const cand = resp.data?.candidates?.[0];
  const parts = cand?.content?.parts;
  const merged =
    Array.isArray(parts) ? parts.map((p) => p.text).filter(Boolean).join('') : '';
  const out = String(merged || '').trim();
  if (!out || cand?.finishReason === 'SAFETY') throw new Error('Gemini sin respuesta usable');
  return out;
}

async function ceciliaGeminiReply(userText) {
  const key = resolveGeminiApiKey();
  if (!key) throw new Error('GEMINI_API_KEY no configurada');

  const models = geminiModelCascade();
  let lastErr;
  for (const modelId of models) {
    try {
      return await geminiGenerateContentOnce(userText, key, modelId);
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message || '';
      if (status === 404 || /not found|is not supported/i.test(msg)) {
        console.warn(`[CECILIA/Gemini] modelo "${modelId}" no disponible (${status || 'err'}), siguiente…`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('Gemini: ningún modelo respondió');
}

async function graphSendWhatsAppText(to, body) {
  await axios.post(
    `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
}

/*
 * AXYNTRAX — CECILIA ENGINE V5.0 (chat web)
 * Conversión de leads + resiliencia; IA solo si el mensaje es corto/simple tras reglas.
 */
const VENTAS_FALLBACK = {
  saludo:
    '¡Hola! 👋 Soy Cecilia de Axyntrax Automation. ¿Quieres activar tu sistema o automatizar tu negocio ahora?',
  flujo_registro:
    'Perfecto 🙌 Para activarte la prueba gratuita de 45 días necesito estos datos rápidos: Nombre, WhatsApp, Email, Empresa y Rubro.',
  enlace_descarga:
    '✅ Registro completado. Descarga tu sistema aquí: https://www.axyntrax-automation.net/api/installer',
  error_fallback:
    'Estamos con alta demanda, pero no te preocupes. Puedes registrarte y bajar el instalador directamente aquí: https://www.axyntrax-automation.net/api/installer'
};

app.post('/api/chat', async (req, res) => {
  try {
    const raw = String(req.body?.message || '').trim();
    const visitorId = req.body?.visitorId;
    const msg = raw.toLowerCase();

    if (!raw) {
      return res.status(400).json({ ok: false, error: 'message requerido' });
    }

    if (visitorId) {
      console.log('[CECILIA/chat]', String(visitorId).slice(0, 64), '|', raw.slice(0, 120));
    }

    // 1) Intención de conversión antes que saludo genérico ("hola quiero activar" → registro)
    if (msg.includes('activar') || msg.includes('prueba') || msg.includes('precio')) {
      return res.json({ reply: VENTAS_FALLBACK.flujo_registro });
    }

    if (
      msg.includes('hola') ||
      msg.includes('buenos') ||
      msg.includes('buenas') ||
      msg.includes('qué tal') ||
      msg.includes('que tal')
    ) {
      return res.json({ reply: VENTAS_FALLBACK.saludo });
    }

    if (raw.includes('@') || msg.includes('empresa') || raw.length > 50) {
      return res.json({ reply: VENTAS_FALLBACK.enlace_descarga });
    }

    if (!resolveGeminiApiKey()) {
      return res.json({ reply: VENTAS_FALLBACK.error_fallback });
    }

    try {
      const reply = await ceciliaGeminiReply(raw);
      return res.json({ reply });
    } catch (e) {
      console.error('[CECILIA/chat Gemini]', e.response?.data || e.message || e);
      return res.json({ reply: VENTAS_FALLBACK.error_fallback });
    }
  } catch (err) {
    console.error('[CECILIA/chat]', err);
    return res.status(200).json({ reply: VENTAS_FALLBACK.error_fallback });
  }
});

/** Debe coincidir con “Verify token” en Meta → WhatsApp → Configuration. En Vercel: META_VERIFY_TOKEN=Axyntrax_2026_Secure */
const META_VERIFY_TOKEN_FIXED = 'Axyntrax_2026_Secure';
const META_VERIFY_TOKEN =
  String(process.env.META_VERIFY_TOKEN || '').trim() || META_VERIFY_TOKEN_FIXED;

// Demo lead → Supabase public.leads (solo REST + anon key; sin SQLite).
// Vercel: SUPABASE_URL y SUPABASE_ANON_KEY (Project Settings → API).
app.post('/api/registro-demo', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[registro-demo] Faltan SUPABASE_URL o SUPABASE_ANON_KEY');
    return res.status(500).json({ ok: false, error: 'config' });
  }

  const body = req.body || {};
  const nombre = String(body.nombre || '').trim();
  const whatsapp = String(body.whatsapp || '').trim();
  const email = String(body.email || '').trim();
  const empresa = String(body.empresa || '').trim();
  const rubroRaw = String(body.rubro || '').trim();

  if (!nombre || !whatsapp) {
    return res.status(400).json({ ok: false, error: 'nombre y whatsapp requeridos' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'email inválido' });
  }

  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const fecha = new Date().toISOString();
  const row = {
    nombre,
    whatsapp,
    email: email || null,
    empresa: empresa || null,
    rubro: rubroRaw ? rubroRaw : null,
    fecha,
    acepta_terminos: !!body.acepta_terminos,
    acepta_marketing: !!body.acepta_marketing,
    timestamp_consentimiento: String(body.timestamp_consentimiento || '').trim() || fecha,
    version_terminos: String(body.version_terminos || '').trim() || 'mayo-2025',
    origen: 'web_axyntrax',
    estado: 'nuevo'
  };

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  };

  try {
    await axios.post(`${baseUrl}/rest/v1/leads`, row, { headers, timeout: 12000 });
    return res.status(200).json({ ok: true });
  } catch (err) {
    const status = err.response?.status;
    const minimal = {
      nombre,
      whatsapp,
      rubro: row.rubro,
      fecha: row.fecha
    };
    if (status === 400 || status === 422) {
      try {
        await axios.post(`${baseUrl}/rest/v1/leads`, minimal, { headers, timeout: 12000 });
        return res.status(200).json({ ok: true, partial: true });
      } catch (err2) {
        console.error('[registro-demo] fallback mínimo', err2.response?.status, err2.response?.data || err2.message);
      }
    }
    console.error('[registro-demo]', status, err.response?.data || err.message);
    return res.status(502).json({ ok: false, error: 'supabase' });
  }
});

// Webhook Verification (GET /api) — Meta envía hub.mode, hub.verify_token, hub.challenge
app.get('/api', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN && challenge != null) {
    console.log('Webhook verificado ✅');
    return res.status(200).type('text/plain').send(String(challenge));
  }
  if (!mode && !token && !challenge) {
    return res.status(200).type('text/plain').send('AXYNTRAX API activa. Webhook Meta: GET /api con parámetros hub.*');
  }
  res.sendStatus(403);
});

// Message Handling (POST /api) — WhatsApp + Cecilia (Gemini); si la IA falla, mensaje amistoso fijo
app.post('/api', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message?.type === 'text') {
      if (!WHATSAPP_TOKEN) {
        console.error('[POST /api] WHATSAPP_TOKEN no definida; no se puede responder por Graph API.');
        return res.sendStatus(200);
      }
      const from = message.from;
      const text = message.text.body;

      console.log(`Mensaje de ${from}: ${text}`);

      let replyBody = CECILIA_FALLBACK_WHATSAPP;
      try {
        replyBody = await ceciliaGeminiReply(text);
      } catch (geminiErr) {
        console.error(
          '[CECILIA/Gemini]',
          geminiErr.response?.data || geminiErr.message || geminiErr
        );
        replyBody = CECILIA_FALLBACK_WHATSAPP;
      }

      try {
        await graphSendWhatsAppText(from, replyBody);
      } catch (wspErr) {
        console.error('[WhatsApp Graph]', wspErr.response?.data || wspErr.message);
      }
      return res.sendStatus(200);
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('Error POST /api:', error.response?.data || error.message);
    return res.sendStatus(200);
  }
});

module.exports = app;
