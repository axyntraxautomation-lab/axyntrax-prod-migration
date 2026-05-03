/**
 * AXYNTRAX — CECILIA Webhook v2.3 (Mock Mode Ready)
 * Vercel Serverless Function | /api/webhook
 *
 * MOCK MODE: Si META_ACCESS_TOKEN === "mock_token_123"
 * → No hace peticiones reales. Solo simula en consola.
 */

const axios = require("axios");

const WSP_TOKEN    = process.env.META_ACCESS_TOKEN || "mock_token_123";
const WSP_PHONE_ID = process.env.META_PHONE_ID     || "mock_phone_123";
const GEMINI_KEY   = process.env.GEMINI_API_KEY    || "mock_gemini_123";
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "Axyntrax_2026_Secure";
const META_VERSION = "v19.0";
const BOT_PHONE    = "51991740590";

// ── ¿Estamos en modo simulación? ──────────────────────────────
const IS_MOCK = WSP_TOKEN === "mock_token_123";

if (IS_MOCK) {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  CECILIA — MODO SIMULACIÓN ACTIVO 🧪     ║");
  console.log("║  Las respuestas se imprimen en consola   ║");
  console.log("║  sin hacer peticiones reales a Meta/AI   ║");
  console.log("╚══════════════════════════════════════════╝");
}

// ── Rate Limiter ──────────────────────────────────────────────
const rateMap = new Map();
function isLimited(key) {
  const now  = Date.now();
  const d    = rateMap.get(key);
  if (!d || now > d.resetAt) { rateMap.set(key, { count: 1, resetAt: now + 10_000 }); return false; }
  d.count++;
  return d.count > 5;
}

// ── Deduplicación ─────────────────────────────────────────────
const seen = new Set();
function isDup(id) {
  if (!id || seen.has(id)) return true;
  seen.add(id);
  setTimeout(() => seen.delete(id), 60_000);
  return false;
}

// ── Respuestas por intención ──────────────────────────────────
function ceciliaReply(msg) {
  const t = msg.toLowerCase();
  if (t.includes("precio") || t.includes("plan") || t.includes("costo") || t.includes("cuánto"))
    return "💎 Nuestros planes:\n• Starter — S/ 199/mes\n• Pro Cloud — S/ 399/mes\n• Diamante — S/ 799/mes\n\n¿Te hago una cotización?";
  if (t.includes("cita") || t.includes("agendar") || t.includes("reserva"))
    return "📅 ¿Para qué fecha y hora prefieres tu cita?";
  if (t.includes("hola") || t.includes("buenos") || t.includes("buenas"))
    return "¡Hola! 👋 Soy *CECILIA*, la IA de *AxyntraX Automation*.\n\n¿En qué te puedo ayudar?\n1️⃣ Planes y precios\n2️⃣ Agendar cita\n3️⃣ Hablar con asesor";
  if (t === "3" || t.includes("asesor") || t.includes("humano"))
    return "👤 Notificando a un asesor ahora mismo. ¡En breve te contactamos! 🙏";
  return "Soy *CECILIA* de *AxyntraX Automation* 🤖\nHe recibido tu mensaje. ¿En qué puedo ayudarte?\n• Precios | Citas | Soporte";
}

// ── Respuesta IA con Gemini (o mock) ─────────────────────────
async function getAIResponse(userMsg, history = []) {
  if (GEMINI_KEY === "mock_gemini_123") {
    // MOCK: respuesta basada en reglas simples
    return ceciliaReply(userMsg);
  }
  try {
    const resp = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          ...history.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          { role: "user", parts: [{ text: userMsg }] }
        ],
        systemInstruction: {
          parts: [{ text: "Eres CECILIA, asistente IA de AxyntraX Automation. Responde en máximo 5 líneas, tono cálido y profesional peruano. Siempre lleva al cliente hacia una acción concreta (precio, cita o asesor)." }]
        }
      },
      { timeout: 8000 }
    );
    return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || ceciliaReply(userMsg);
  } catch (e) {
    console.error("[GEMINI ERR]", e.message);
    return ceciliaReply(userMsg); // fallback a reglas
  }
}

// ── Enviar mensaje WhatsApp (o mock) ─────────────────────────
async function sendMsg(to, text) {
  if (IS_MOCK) {
    console.log(`\n[🧪 SIMULACIÓN] CECILIA recibió el mensaje y respondió correctamente.`);
    console.log(`  ↳ Para: ${to}`);
    console.log(`  ↳ Respuesta: "${text.substring(0, 100)}..."\n`);
    return true;
  }
  try {
    const r = await axios.post(
      `https://graph.facebook.com/${META_VERSION}/${WSP_PHONE_ID}/messages`,
      { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: text } },
      { headers: { Authorization: `Bearer ${WSP_TOKEN}`, "Content-Type": "application/json" }, timeout: 8000 }
    );
    return r.status === 200;
  } catch (e) {
    console.error("[WSP ERR]", e.response?.data || e.message);
    return false;
  }
}

// ── Handler principal ─────────────────────────────────────────
module.exports = async function handler(req, res) {

  // GET — Verificación Meta
  if (req.method === "GET") {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[CECILIA ✅] Meta verificación exitosa");
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // POST — Mensajes
  if (req.method === "POST") {
    res.status(200).json({ status: "ok" }); // Inmediato a Meta

    const body = req.body;
    if (body?.object !== "whatsapp_business_account") return;

    const ip = req.headers["x-forwarded-for"] || "unknown";
    if (isLimited(`ip:${ip}`)) return;

    for (const entry of (body.entry || [])) {
      const value = entry?.changes?.[0]?.value;
      if (!value?.messages) continue;

      const msg  = value.messages[0];
      if (msg.type !== "text") continue;

      const from = msg.from;
      const text = msg.text?.body?.trim() || "";

      if (from === BOT_PHONE || isDup(msg.id) || isLimited(from)) continue;

      console.log(`[CECILIA 📩] De: ${from} | "${text.substring(0, 60)}"`);

      const reply = await getAIResponse(text);
      await sendMsg(from, reply);
    }
    return;
  }

  res.status(405).send("Method Not Allowed");
};
