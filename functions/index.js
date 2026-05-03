/**
 * ============================================================
 *  AXYNTRAX AUTOMATION — CECILIA WhatsApp Webhook v2.2
 *  Firebase Cloud Functions  |  Meta Cloud API v19.0
 *  INCLUYE: Anti-Loop + Rate Limiting + Deduplicación
 * ============================================================
 */

const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const axios     = require("axios");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ============================================================
//  CREDENCIALES META
// ============================================================

// PEGA AQUI TU TOKEN DE META (empieza con EAA...)
const WSP_TOKEN    = process.env.META_ACCESS_TOKEN || "PENDIENTE";

// PHONE NUMBER ID — se configura en .env como META_PHONE_ID
const WSP_PHONE_ID = process.env.META_PHONE_ID     || "PENDIENTE";

const VERIFY_TOKEN     = "Axyntrax_2026_Secure";
const META_API_VERSION = "v19.0";

// ── Número propio del bot (para evitar auto-respuesta) ────────
// Es el número de WhatsApp Business de AXYNTRAX
const BOT_PHONE = "51991740590";

// ============================================================
//  ANTI-LOOP: Rate Limiter en Memoria (para Firebase Functions)
//  Bloquea si la misma IP o número supera 5 req/10 seg
// ============================================================
const rateLimitMap = new Map(); // key: ip|número → {count, resetAt}

function isRateLimited(key) {
  const now  = Date.now();
  const data = rateLimitMap.get(key);

  if (!data || now > data.resetAt) {
    // Ventana nueva: 10 segundos, máximo 5 peticiones
    rateLimitMap.set(key, { count: 1, resetAt: now + 10_000 });
    return false;
  }

  data.count++;
  if (data.count > 5) {
    functions.logger.warn(`[ANTI-LOOP 🚫] Rate limit alcanzado para: ${key}`);
    return true;
  }
  return false;
}

// ============================================================
//  ANTI-LOOP: Deduplicación por message_id (evita doble proceso)
// ============================================================
const processedIds = new Set(); // En producción usar Redis/Firestore TTL

function isDuplicate(messageId) {
  if (!messageId) return false;
  if (processedIds.has(messageId)) {
    functions.logger.warn(`[ANTI-LOOP 🚫] Mensaje duplicado ignorado: ${messageId}`);
    return true;
  }
  processedIds.add(messageId);
  // Auto-limpiar después de 60 seg para no saturar memoria
  setTimeout(() => processedIds.delete(messageId), 60_000);
  return false;
}


// ============================================================
//  ENVIAR MENSAJE WHATSAPP (Motor CECILIA)
// ============================================================
async function enviarMensajeWhatsApp(telefono, texto) {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${WSP_PHONE_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to:                telefono,
    type:              "text",
    text:              { body: texto },
  };

  const headers = {
    Authorization:  `Bearer ${WSP_TOKEN}`,
    "Content-Type": "application/json",
  };

  for (let intento = 1; intento <= 3; intento++) {
    try {
      const resp = await axios.post(url, payload, { headers, timeout: 8000 });
      if (resp.status === 200) {
        functions.logger.info(`[CECILIA ✅] Enviado a ${telefono}`);
        return true;
      }
    } catch (err) {
      const detalle = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      functions.logger.error(`[CECILIA ❌] Intento ${intento} | ${detalle}`);
      if (intento < 3) await new Promise(r => setTimeout(r, 1000 * intento));
    }
  }
  return false;
}


// ============================================================
//  RESPUESTA POR INTENCIÓN
// ============================================================
function generarRespuesta(mensaje, leadData) {
  const txt    = mensaje.toLowerCase();
  const nombre = leadData?.nombre || "estimado cliente";

  if (txt.includes("precio") || txt.includes("costo") || txt.includes("plan") || txt.includes("cuánto") || txt.includes("cuanto")) {
    return (
      `💎 Hola ${nombre}! Nuestros planes:\n\n` +
      "• *Starter* — S/ 199/mes\n" +
      "• *Pro Cloud* — S/ 399/mes\n" +
      "• *Diamante* — S/ 799/mes\n\n" +
      "¿Quieres una cotización? Escribe *COTIZACIÓN* 📄"
    );
  }

  if (txt.includes("cita") || txt.includes("turno") || txt.includes("reserva") || txt.includes("agendar")) {
    return `📅 ${nombre}, ¿para qué fecha y hora prefieres tu cita?`;
  }

  if (txt.includes("hola") || txt.includes("buenos") || txt.includes("buenas") || txt.includes("hi")) {
    return (
      `¡Hola ${nombre}! 👋 Soy *CECILIA*, la IA de *AxyntraX Automation*.\n\n` +
      "¿En qué te puedo ayudar?\n" +
      "1️⃣ Planes y precios\n" +
      "2️⃣ Agendar una cita\n" +
      "3️⃣ Hablar con un asesor"
    );
  }

  if (txt === "3" || txt.includes("asesor") || txt.includes("humano")) {
    return "👤 Voy a notificar a un asesor ahora mismo. ¡En breve te contactamos! 🙏";
  }

  return (
    "Hola, soy *CECILIA* de *AxyntraX Automation* 🤖\n" +
    "He recibido tu mensaje. ¿En qué puedo ayudarte?\n" +
    "• Precios | Citas | Soporte"
  );
}


// ============================================================
//  PROCESADOR DE MENSAJES
// ============================================================
async function procesarMensaje(entry, clientIp) {
  try {
    const value = entry?.changes?.[0]?.value;
    if (!value?.messages) return; // Solo mensajes, no status

    const msg       = value.messages[0];
    const messageId = msg.id;

    if (msg.type !== "text") return;

    const telefono = msg.from;
    const texto    = msg.text?.body?.trim() || "";
    const ts       = Date.now();

    // ── ANTI-LOOP CHECKS ──────────────────────────────────
    // 1. Bloquear si el mensaje viene del propio bot
    if (telefono === BOT_PHONE || telefono === `51${BOT_PHONE}`) {
      functions.logger.warn(`[ANTI-LOOP 🚫] Mensaje del propio bot ignorado.`);
      return;
    }

    // 2. Deduplicación por message_id
    if (isDuplicate(messageId)) return;

    // 3. Rate limit por número
    if (isRateLimited(telefono)) return;

    // 4. Rate limit por IP del servidor que llama
    if (clientIp && isRateLimited(clientIp)) return;

    functions.logger.info(`[CECILIA 📩] De: ${telefono} | "${texto.substring(0, 80)}"`);

    // ── Firestore ─────────────────────────────────────────
    const leadRef  = db.collection("leads").doc(telefono);
    const leadSnap = await leadRef.get();
    let respuesta;

    if (!leadSnap.exists) {
      await leadRef.set({
        telefono,
        status:    "nuevo",
        modulo:    "general",
        nombre:    null,
        historia:  [{ role: "user", content: texto, ts }],
        creado_en: admin.firestore.FieldValue.serverTimestamp(),
      });
      respuesta =
        "¡Hola! 👋 Soy *CECILIA*, la IA de *AxyntraX Automation*.\n\n" +
        "Estoy lista para ayudarte a automatizar tu negocio 24/7 🚀\n\n" +
        "¿Con quién tengo el gusto de hablar?";
    } else {
      await leadRef.update({
        historia: admin.firestore.FieldValue.arrayUnion({ role: "user", content: texto, ts }),
        ultima_actividad: admin.firestore.FieldValue.serverTimestamp(),
      });
      respuesta = generarRespuesta(texto, leadSnap.data());
    }

    // ── Enviar y guardar respuesta ─────────────────────────
    const ok = await enviarMensajeWhatsApp(telefono, respuesta);
    if (ok) {
      await leadRef.update({
        historia: admin.firestore.FieldValue.arrayUnion({
          role: "assistant", content: respuesta, ts: Date.now(),
        }),
      });
    }

  } catch (err) {
    functions.logger.error("[CECILIA ERROR]", err.message);
  }
}


// ============================================================
//  CLOUD FUNCTION: ceciliaWebhook
//  URL: https://us-central1-axyntrax-automation.cloudfunctions.net/ceciliaWebhook
// ============================================================
exports.ceciliaWebhook = functions
  .region("us-central1")
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onRequest(async (req, res) => {

    // ── GET: Verificación Meta ─────────────────────────────
    if (req.method === "GET") {
      const mode      = req.query["hub.mode"];
      const token     = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        functions.logger.info("[WEBHOOK ✅] Meta verificación exitosa.");
        return res.status(200).send(challenge);
      }
      return res.status(403).send("Forbidden");
    }

    // ── POST: Mensajes entrantes ───────────────────────────
    if (req.method === "POST") {
      // Responder 200 INMEDIATAMENTE (obligatorio para Meta)
      res.status(200).send("EVENT_RECEIVED");

      const body     = req.body;
      const clientIp = req.headers["x-forwarded-for"] || req.ip || "unknown";

      if (body?.object !== "whatsapp_business_account") return;

      // ANTI-LOOP: Rate limit global por IP entrante
      if (isRateLimited(`ip:${clientIp}`)) {
        functions.logger.warn(`[ANTI-LOOP 🚫] IP ${clientIp} bloqueada por rate limit.`);
        return;
      }

      const entries = body?.entry || [];
      for (const entry of entries) {
        procesarMensaje(entry, clientIp).catch(e =>
          functions.logger.error("[ENTRY ERROR]", e.message)
        );
      }
      return;
    }

    return res.status(405).send("Method Not Allowed");
  });


// ============================================================
//  CLOUD FUNCTION: healthCheck
// ============================================================
exports.healthCheck = functions
  .region("us-central1")
  .https.onRequest((req, res) => {
    res.status(200).json({
      status:    "OPERATIONAL ✅",
      service:   "CECILIA — AXYNTRAX WhatsApp Bot v2.2",
      timestamp: new Date().toISOString(),
      antiloop: {
        bot_phone_blocked:  BOT_PHONE,
        rate_limit:         "5 req / 10 seg por número",
        deduplication:      "por message_id (TTL 60s)",
      },
      config: {
        token_ok:    WSP_TOKEN    !== "PEGA_TU_TOKEN_DE_META_AQUI",
        phone_id_ok: WSP_PHONE_ID !== "PEGA_TU_PHONE_NUMBER_ID_AQUI",
        verify_token: VERIFY_TOKEN,
        webhook_url:  "https://us-central1-axyntrax-automation.cloudfunctions.net/ceciliaWebhook",
      },
    });
  });
