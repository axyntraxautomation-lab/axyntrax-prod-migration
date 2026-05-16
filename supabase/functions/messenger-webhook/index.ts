import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const K = Deno.env.get("DEEPSEEK_API_KEY")!;
const V = Deno.env.get("WEBHOOK_VERIFY_TOKEN")!;
const PAGE_ACCESS_TOKEN = Deno.env.get("MESSENGER_ACCESS_TOKEN")!;

const sp = "Eres Cecilia, asesora Axyntrax. Si te saludan, muestra ESTE MENÚ: 1️⃣ Legal ⚖️, 2️⃣ Clínica 🏥, 3️⃣ Veterinaria 🐾, 4️⃣ Carwash 🚗, 5️⃣ Residencial 🏢, 6️⃣ Restaurante 🍽️, 7️⃣ Logística 📦, 8️⃣ Mecánico 🛠️, 9️⃣ Transportes 🚚, 🔟 Ventas 💼. Si eligen un NÚMERO (1-10), GENERA 5 submódulos prácticos para ese rubro con precios entre S/ 9.00 y S/ 25.00. REGLAS OBLIGATORIAS: 1) TODOS los precios mostrados deben llevar el texto '+ IGV' al lado. 2) INFORMA ESTA PROMOCIÓN: '🎁 PROMOCIÓN BÁSICA: ¡Te regalamos 3 submódulos totalmente GRATIS! A partir del cuarto, pagas su precio mensual. Credencial extra para otra PC o usuario: S/ 15.00 + IGV mensuales.'. 3) Despídete pidiendo: 'Para armar tu demo, elige tus 3 submódulos gratuitos de la lista.'";

async function reply(userMessage: string) {
  const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${K}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: sp },
        { role: "user", content: userMessage }
      ]
    })
  });
  const d = await r.json();
  return d?.choices?.[0]?.message?.content || "Disculpe, ¿podría repetir?";
}

async function sendMessenger(senderId: string, text: string) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error("MESSENGER_ACCESS_TOKEN no está configurado.");
    return;
  }
  await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: senderId },
      message: { text: text }
    })
  });
}

serve(async (req) => {
  const u = new URL(req.url);

  // Verificación de Webhook para Facebook Messenger
  if (req.method === "GET") {
    const mode = u.searchParams.get("hub.mode");
    const token = u.searchParams.get("hub.verify_token");
    const challenge = u.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === V) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Error", { status: 403 });
  }

  // Recepción de mensajes de Messenger e Instagram
  if (req.method === "POST") {
    try {
      const body = await req.json();

      if (body.object === "page" || body.object === "instagram") {
        for (const entry of body.entry) {
          const webhookEvent = entry.messaging?.[0];
          
          if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
            const senderId = webhookEvent.sender.id;
            const text = webhookEvent.message.text;

            // Enviar typing indicator (opcional, ayuda a que no parezca bot muerto)
            await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recipient: { id: senderId }, sender_action: "typing_on" })
            });

            const resp = await reply(text);
            await sendMessenger(senderId, resp);
          }
        }
      }
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    } catch (e) {
      return new Response("Internal Error", { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
