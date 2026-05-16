const K = "sk-35a2df423493494da624fae10a129bd3";
const T = "EAAOEfgGZC6gEBRSp6KomwAjzds7xSyhjjrZBKxdcLfC2jFtlyyN5ZBW6sZBePFmeP6QCYzkKFrI0k4omvuMmc5jHAZBkTpOZCdIHSMpG0LxxwAn3imbA4slwXewr9CxmCWdCRr7gpRgqSdLr1hCCZBZC05jMavDR7IWZC2QGzy30wG1sJi4i11D8e9gQGSsZAbUZBY7ZBVGSquc8NXm4xbdsPcX124B8N36BnIK3bMGkINFAlcDXqGpY8xw4gudhZCxg3yTZBGRYt5KPGD1Gtvu6NYFOyOlwZDZD";
const P = "1148012698386108";
const TM = "EAAOEfgGZC6gEBRfed6ApWEZA1IQ4Gotd34U04So7uHB57HlhOfsJcBFdywF2Ut5pbYKnZAFymTeRhh8CK4KsrDJORNh8nWQWONw8ZBHF1raY3LxNsZBDaImq3beq9ZBG9SFcfNpvZAC2meDuLExqhyzCPzBDyVap4oDrVPlS2Utrh7EhZCSTH0UCtvIsfG3mconkITYWWAZDZD";

async function testDeepSeek() {
  console.log("Testing DeepSeek...");
  const sp="Eres Cecilia, asesora Axyntrax. Si te saludan, muestra ESTE MENÚ: 1️⃣ Legal ⚖️, 2️⃣ Clínica 🏥, 3️⃣ Veterinaria 🐾, 4️⃣ Carwash 🚗, 5️⃣ Residencial 🏢, 6️⃣ Restaurante 🍽️, 7️⃣ Logística 📦, 8️⃣ Mecánico 🛠️, 9️⃣ Transportes 🚚, 🔟 Ventas 💼. Si eligen un NÚMERO (1-10), GENERA 5 submódulos prácticos para ese rubro con precios entre S/ 9.00 y S/ 25.00. REGLAS OBLIGATORIAS: 1) TODOS los precios mostrados deben llevar el texto '+ IGV' al lado. 2) INFORMA ESTA PROMOCIÓN: '🎁 PROMOCIÓN BÁSICA: ¡Te regalamos 3 submódulos totalmente GRATIS! A partir del cuarto, pagas su precio mensual. Credencial extra para otra PC o usuario: S/ 15.00 + IGV mensuales.'. 3) Despídete pidiendo: 'Para armar tu demo, elige tus 3 submódulos gratuitos de la lista.'";
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${K}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{role: "system", content: sp}, {role: "user", content: "4"}]
    })
  });
  console.log("DeepSeek Status:", res.status);
  const data = await res.json();
  console.log("DeepSeek Resp:", JSON.stringify(data));
}

async function testWhatsApp() {
  console.log("Testing WhatsApp Graph API...");
  const to = "51991740590"; // From the user's simulation
  const res = await fetch(`https://graph.facebook.com/v18.0/${P}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${T}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      text: {body: "Prueba desde script local"}
    })
  });
  console.log("WhatsApp Status:", res.status);
  const data = await res.json();
  console.log("WhatsApp Resp:", JSON.stringify(data));
}

async function testMessenger() {
  console.log("Testing Messenger API...");
  const to = "51991740590"; 
  const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${TM}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: to },
      message: { text: "Prueba Messenger" }
    })
  });
  console.log("Messenger Status:", res.status);
  const data = await res.json();
  console.log("Messenger Resp:", JSON.stringify(data));
}

async function run() {
  await testDeepSeek();
  await testWhatsApp();
  await testMessenger();
}

run();
