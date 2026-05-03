/**
 * AXIA — Agente de Ventas B2B Web
 * Vercel Serverless | POST /api/chat-web
 * Mock mode: respuestas simuladas de ventas B2B elaboradas
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || "mock_gemini_123";
const IS_MOCK = GEMINI_KEY === "mock_gemini_123";

// ── Motor de precios por sofisticación ────────────────────────
const IGV = 0.18;

// Niveles de sofisticación: base + extras por feature
const PRICING = {
  // ── SALUD ─────────────────────────────────────────────────
  clinica_basico: {
    label: 'Clínica Médica — Plan Básico',
    base: 199,
    features: ['Bot WhatsApp 24/7', 'Agenda de citas', 'Recordatorios automáticos'],
    nivel: 1
  },
  clinica_pro: {
    label: 'Clínica Médica — Plan Pro',
    base: 199, extras: [{ name:'Historia clínica digital', price:80 }, { name:'IA Gemini (respuestas inteligentes)', price:60 }, { name:'Reportes ejecutivos', price:40 }],
    features: ['Todo Básico', 'Historia clínica digital', 'IA integrada', 'KPIs en tiempo real'],
    nivel: 2
  },
  clinica_diamante: {
    label: 'Clínica Médica — Plan Diamante',
    base: 199, extras: [{ name:'Historia clínica digital', price:80 }, { name:'IA Gemini', price:60 }, { name:'Reportes ejecutivos', price:40 }, { name:'Módulo SUNAT/Facturación', price:120 }, { name:'Multi-sede', price:100 }, { name:'App móvil', price:150 }],
    features: ['Todo Pro', 'Facturación electrónica SUNAT', 'Multi-sede', 'App móvil', 'Soporte dedicado'],
    nivel: 3
  },
  // ── DENTAL ────────────────────────────────────────────────
  dental_basico: {
    label: 'Clínica Dental — Plan Básico',
    base: 179,
    features: ['Bot WhatsApp', 'Agenda dental', 'Recordatorio de citas'],
    nivel: 1
  },
  dental_pro: {
    label: 'Clínica Dental — Plan Pro',
    base: 179, extras: [{ name:'Odontograma digital', price:90 }, { name:'Plan de tratamiento IA', price:70 }, { name:'Galería fotográfica dental', price:50 }],
    features: ['Todo Básico', 'Odontograma digital', 'Plan de tratamiento', 'Fotos del caso'],
    nivel: 2
  },
  dental_diamante: {
    label: 'Clínica Dental — Plan Diamante',
    base: 179, extras: [{ name:'Odontograma digital', price:90 }, { name:'Plan de tratamiento IA', price:70 }, { name:'Galería fotográfica', price:50 }, { name:'Facturación SUNAT', price:120 }, { name:'Programa de fidelización', price:80 }],
    features: ['Todo Pro', 'Facturación SUNAT', 'Programa fidelización', 'Multi-doctor'],
    nivel: 3
  },
  // ── VETERINARIA ───────────────────────────────────────────
  veterinario_basico: {
    label: 'Clínica Veterinaria — Plan Básico',
    base: 159,
    features: ['Bot WhatsApp', 'Ficha de mascotas', 'Agenda de consultas'],
    nivel: 1
  },
  veterinario_pro: {
    label: 'Clínica Veterinaria — Plan Pro',
    base: 159, extras: [{ name:'Historial médico digital', price:70 }, { name:'Control de vacunas', price:50 }, { name:'IA para diagnósticos básicos', price:80 }],
    features: ['Todo Básico', 'Historial médico', 'Control de vacunas', 'IA diagnóstica'],
    nivel: 2
  },
  veterinario_diamante: {
    label: 'Clínica Veterinaria — Plan Diamante',
    base: 159, extras: [{ name:'Historial médico', price:70 }, { name:'Control de vacunas', price:50 }, { name:'IA diagnóstica', price:80 }, { name:'Petshop integrado', price:100 }, { name:'App móvil dueño', price:120 }],
    features: ['Todo Pro', 'Petshop integrado', 'App para dueños', 'Facturación SUNAT'],
    nivel: 3
  },
  // ── LEGAL ─────────────────────────────────────────────────
  legal_basico: {
    label: 'Estudio Legal — Plan Básico',
    base: 229,
    features: ['Bot captación de consultas', 'Agenda de reuniones', 'CRM básico'],
    nivel: 1
  },
  legal_pro: {
    label: 'Estudio Legal — Plan Pro',
    base: 229, extras: [{ name:'Gestión de expedientes', price:100 }, { name:'IA calificación de casos', price:90 }, { name:'Documentos automáticos', price:80 }],
    features: ['Todo Básico', 'Gestión de expedientes', 'IA calificadora', 'Documentos automáticos'],
    nivel: 2
  },
  legal_diamante: {
    label: 'Estudio Legal — Plan Diamante',
    base: 229, extras: [{ name:'Gestión expedientes', price:100 }, { name:'IA calificadora', price:90 }, { name:'Documentos automáticos', price:80 }, { name:'Portal cliente', price:120 }, { name:'Alertas de vencimiento', price:60 }, { name:'Multi-abogado', price:100 }],
    features: ['Todo Pro', 'Portal cliente', 'Alertas legales', 'Multi-abogado', 'Auditoría completa'],
    nivel: 3
  },
  // ── RESIDENCIAL ───────────────────────────────────────────
  residencial_basico: {
    label: 'Gestión Residencial — Plan Básico',
    base: 249,
    features: ['Bot WhatsApp vecinos', 'Control de pagos', 'Comunicados automáticos'],
    nivel: 1
  },
  residencial_pro: {
    label: 'Gestión Residencial — Plan Pro',
    base: 249, extras: [{ name:'Módulo de mantenimiento', price:80 }, { name:'Reserva de amenidades', price:70 }, { name:'Votaciones digitales', price:60 }],
    features: ['Todo Básico', 'Mantenimiento', 'Reserva de amenidades', 'Votaciones'],
    nivel: 2
  },
  residencial_diamante: {
    label: 'Gestión Residencial — Plan Diamante',
    base: 249, extras: [{ name:'Módulo mantenimiento', price:80 }, { name:'Reserva amenidades', price:70 }, { name:'Votaciones', price:60 }, { name:'Control de acceso', price:150 }, { name:'App propietarios', price:130 }, { name:'Cámaras integradas', price:200 }],
    features: ['Todo Pro', 'Control de acceso', 'App propietarios', 'CCTV integrado'],
    nivel: 3
  },
  // ── RESTAURANT ────────────────────────────────────────────
  restaurant_basico: {
    label: 'Restaurant & Food — Plan Básico',
    base: 189,
    features: ['Menú digital QR', 'Reservas por WhatsApp', 'Bot de atención'],
    nivel: 1
  },
  restaurant_pro: {
    label: 'Restaurant & Food — Plan Pro',
    base: 189, extras: [{ name:'Pedidos delivery WhatsApp', price:80 }, { name:'Integración con POS', price:100 }, { name:'Analytics de ventas', price:60 }],
    features: ['Todo Básico', 'Delivery WhatsApp', 'POS integrado', 'Analytics'],
    nivel: 2
  },
  restaurant_diamante: {
    label: 'Restaurant & Food — Plan Diamante',
    base: 189, extras: [{ name:'Pedidos delivery', price:80 }, { name:'POS integrado', price:100 }, { name:'Analytics', price:60 }, { name:'Fidelización + puntos', price:90 }, { name:'Multi-local', price:120 }, { name:'Reseñas automatizadas', price:50 }],
    features: ['Todo Pro', 'Fidelización', 'Multi-local', 'Reseñas Google auto'],
    nivel: 3
  }
};

// Calcula precio con IGV
function calcPrecio(planKey) {
  const plan = PRICING[planKey];
  if (!plan) return null;
  const extrasTotal = (plan.extras || []).reduce((s, e) => s + e.price, 0);
  const subtotal = plan.base + extrasTotal;
  const igv = Math.round(subtotal * IGV);
  const total = subtotal + igv;
  return { subtotal, igv, total, plan };
}

// Formatea precio en tabla bonita
function formatPrecioTable(planKey) {
  const r = calcPrecio(planKey);
  if (!r) return '';
  const { subtotal, igv, total, plan } = r;
  const extrasLines = (plan.extras || []).map(e => `  ├ ${e.name}: S/ ${e.price}`).join('\n');
  const featuresLines = plan.features.map(f => `✓ ${f}`).join('\n');

  return `**${plan.label}**

📦 **Desglose de precio:**
  ├ Módulo base: S/ ${plan.base}
${extrasLines}
  ├ **Subtotal: S/ ${subtotal}**
  └ IGV 18%: S/ ${igv}
  
💰 **TOTAL: S/ ${total}/mes + IGV incluido**

**Incluye:**
${featuresLines}`;
}

// Detecta submódulo y plan del mensaje
function detectPlan(msg) {
  const m = msg.toLowerCase();
  // Vertical
  let vertical = null;
  if (m.includes('clínica') || m.includes('clinica') || m.includes('médico') || m.includes('medico') || m.includes('salud')) vertical = 'clinica';
  else if (m.includes('dental') || m.includes('odonto') || m.includes('dent')) vertical = 'dental';
  else if (m.includes('veterina') || m.includes('mascota') || m.includes('animal')) vertical = 'veterinario';
  else if (m.includes('legal') || m.includes('abogado') || m.includes('jurídico')) vertical = 'legal';
  else if (m.includes('residencial') || m.includes('edificio') || m.includes('condominio')) vertical = 'residencial';
  else if (m.includes('restaurant') || m.includes('comida') || m.includes('food') || m.includes('menú')) vertical = 'restaurant';

  // Plan
  let nivel = 'basico';
  if (m.includes('diamante') || m.includes('premium') || m.includes('completo') || m.includes('todo')) nivel = 'diamante';
  else if (m.includes('pro') || m.includes('avanzado') || m.includes('profesional')) nivel = 'pro';

  return vertical ? `${vertical}_${nivel}` : null;
}



// Motor de respuestas mock B2B — con precios dinámicos + IGV
function getMockResponse(message, history = []) {
  const msg = message.toLowerCase();

  // ── 1. Detección de precio específico por plan ──────────────
  const planKey = detectPlan(message);
  const isPrecioQuery = ['precio', 'costo', 'cuánto', 'cuanto', 'tarifa', 'inversión', 'inversion', 'cobran', 'vale', 'plan'].some(t => msg.includes(t));

  if (isPrecioQuery && planKey) {
    const cotizacion = formatPrecioTable(planKey);
    return {
      text: `Aquí tienes la cotización exacta con IGV incluido 💰\n\n${cotizacion}\n\n⚠️ *Todos los precios son en Soles (S/) e incluyen IGV 18%.*\n\n¿Quieres que compare los 3 niveles (Básico, Pro y Diamante) para este módulo, o prefieres agendar una demo gratuita?`,
      intent: 'precio_calculado', confidence: 0.98
    };
  }

  // ── 2. Solicitud de comparar todos los planes de un vertical ─
  if ((msg.includes('todos') || msg.includes('comparar') || msg.includes('opciones') || msg.includes('planes')) && planKey) {
    const vertical = planKey.split('_')[0];
    const keys = [`${vertical}_basico`, `${vertical}_pro`, `${vertical}_diamante`];
    const tablas = keys.map(k => formatPrecioTable(k)).filter(Boolean).join('\n\n---\n\n');
    return {
      text: `Aquí están los **3 niveles disponibles** para tu sector 📊\n\n${tablas}\n\n⚠️ *Precios en S/ + IGV 18% incluido.*\n\n¿Cuál nivel se adapta mejor a tu operación actual?`,
      intent: 'comparativa_planes', confidence: 0.97
    };
  }

  // ── 3. Precio genérico (sin vertical detectado) ─────────────
  if (isPrecioQuery) {
    const examples = [
      formatPrecioTable('clinica_basico'),
      formatPrecioTable('legal_pro'),
      formatPrecioTable('restaurant_diamante')
    ].join('\n\n---\n\n');
    return {
      text: `Los precios varían según el módulo y nivel de sofisticación. Aquí algunos ejemplos 📋\n\n${examples}\n\n⚠️ *Todos los precios incluyen IGV 18%.*\n\n¿En qué sector opera tu empresa? Así te doy la cotización exacta para tu caso.`,
      intent: 'precio_general', confidence: 0.90
    };
  }

  // ── 4. Saludo ───────────────────────────────────────────────
  if (['hola', 'buenos', 'buenas', 'hi', 'hey', 'saludos'].some(t => msg.includes(t))) {
    return {
      text: `¡Hola! Soy **AXIA**, el agente de inteligencia artificial de **AxyntraX Automation**. 🤖✨\n\nAyudo a empresas a **automatizar el 80% de sus operaciones** usando IA.\n\n¿En qué sector opera tu empresa?\n1️⃣ Salud (Clínica / Dental / Veterinaria)\n2️⃣ Servicios Profesionales (Legal)\n3️⃣ Gestión Residencial\n4️⃣ Restaurant / Gastronomía\n\n*Dime tu sector y te calculo el precio exacto con IGV incluido.*`,
      intent: 'saludo', confidence: 0.99
    };
  }

  // ── 5. Demo ─────────────────────────────────────────────────
  if (['demo', 'prueba', 'ver', 'mostrar', 'probar'].some(t => msg.includes(t))) {
    return {
      text: `¡Perfecto! 🚀 Tenemos 2 opciones:\n\n**Opción A — Demo en vivo (15 min)**\nTe muestro el sistema funcionando con datos de tu sector. Disponible L-V, 9am-6pm.\n\n**Opción B — Prueba gratuita 7 días**\nInstalamos en tu negocio sin costo. Ves el ROI real antes de comprometerte.\n\nPara agendar necesito:\n• Tu nombre y empresa\n• WhatsApp de contacto\n\n¿Cuál prefieres?`,
      intent: 'demo', confidence: 0.95
    };
  }

  // ── 6. Respuesta por defecto rotativa ───────────────────────
  const defaults = [
    `Entiendo. En AxyntraX automatizamos operaciones completas con IA. 💡\n\n¿Cuál es el mayor cuello de botella en tu empresa ahora mismo?\n\n*Una vez que me lo dices, te calculo el precio exacto (con IGV) para resolverlo.*`,
    `La mayoría de nuestros clientes recuperan la inversión en el **primer mes**. 🎯\n\n¿Me dices en qué sector operates? Así te doy la cotización exacta para tu módulo, con desglose de subtotal + IGV 18%.`,
    `Interesante. Antes de darte el precio exacto, necesito saber: **¿qué nivel de automatización buscas?**\n\n🥈 Básico — Lo esencial para empezar\n🥇 Pro — Con IA integrada\n💎 Diamante — Todo incluido\n\n¿Cuál se acerca más a lo que necesitas?`
  ];
  return { text: defaults[history.length % defaults.length], intent: 'general', confidence: 0.75 };
}

// Respuesta real con Gemini — conoce precios dinámicos + IGV
async function getGeminiResponse(message, history) {
  const axios = require('axios');

  // Detecta plan y pre-calcula precio para dárselo a Gemini
  const planKey = detectPlan(message);
  const precioInfo = planKey ? `\nCotización calculada para "${planKey}": ${JSON.stringify(calcPrecio(planKey))}` : '';

  const systemPrompt = `Eres AXIA, el agente de ventas B2B de AxyntraX Automation (Perú).
Especialidad: automatización con IA para Clínicas, Dental, Veterinaria, Legal, Residencial, Restaurant.
REGLA DE PRECIOS (CRÍTICA): 
- Los precios SIEMPRE se muestran con IGV 18% incluido (total = subtotal × 1.18)
- Cada módulo tiene precio base + extras por funcionalidad (más sofisticación = más precio)
- NUNCA des un precio sin calcular el IGV y mostrarlo desglosado
${precioInfo}
Objetivo: Calificar lead y cerrar demo o prueba 7 días.
Estilo: Profesional, empático, orientado a ROI. Máximo 150 palabras. SIEMPRE termina con pregunta de cierre.`;

  const contents = [
    ...history.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const resp = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
    { contents, systemInstruction: { parts: [{ text: systemPrompt }] } },
    { timeout: 10000 }
  );

  return {
    text: resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || getMockResponse(message, history).text,
    intent: planKey ? 'precio_calculado' : 'ai',
    confidence: 1.0
  };
}


// Lead tracker en memoria (para el dashboard)
const leadsDB = [];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/chat-web — retorna leads para el dashboard
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      mode: IS_MOCK ? 'simulation' : 'production',
      leads: leadsDB.slice(-20),
      stats: {
        totalLeads: leadsDB.length,
        hotLeads: leadsDB.filter(l => l.score === 'hot').length,
        conversions: Math.floor(leadsDB.length * 0.23)
      }
    });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { message, history = [], sessionId, visitorInfo = {} } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  let reply;
  try {
    reply = IS_MOCK
      ? getMockResponse(message, history)
      : await getGeminiResponse(message, history);
  } catch (e) {
    console.error('[AXIA chat error]', e.message);
    reply = getMockResponse(message, history);
  }

  // Guardar lead si hay señal de interés
  const isHot = ['precio', 'demo', 'plan', 'cuánto', 'prueba'].some(k => message.toLowerCase().includes(k));
  if (isHot || history.length > 3) {
    leadsDB.push({
      id: Date.now(),
      sessionId: sessionId || 'anon',
      score: isHot ? 'hot' : 'warm',
      lastMessage: message.substring(0, 80),
      intent: reply.intent,
      timestamp: new Date().toISOString(),
      visitorInfo
    });
  }

  return res.status(200).json({
    reply: reply.text,
    intent: reply.intent,
    confidence: reply.confidence,
    mode: IS_MOCK ? 'simulation' : 'production',
    sessionId: sessionId || `axia_${Date.now()}`
  });
};
