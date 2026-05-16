import { NextResponse } from 'next/server';
import { askCecilia } from '@/lib/cecilia-logic';
import { generateQuotePDF } from '@/lib/pdf-generator';
import { uploadToMeta, sendWhatsAppDocument, sendWhatsAppMessage } from '@/lib/whatsapp-media';
import { MODULES } from '@/lib/modules-data';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { reportToAtlas } from '@/lib/atlas-reporting';

const VERIFY_TOKEN = process.env.WH_VERIFY_TOKEN || 'axyntrax_verify_2026';

interface UserState {
  nombreUsuario: string | null;
  moduloActual: string | null;
  submoduloActual: string | null;
  submodulosVistos: string[];
  submodulosInteresado: string[];
  lastInteraction: number;
  leadTemperature?: 'HOT' | 'WARM' | 'COLD';
  leadIntent?: string;
  resumenNecesidad?: string;
  empresa?: string;
  telefono?: string;
  email?: string;
}

const DEFAULT_STATE: UserState = {
  nombreUsuario: null,
  moduloActual: null,
  submoduloActual: null,
  submodulosVistos: [],
  submodulosInteresado: [],
  lastInteraction: Date.now()
};

async function getUserState(userId: string): Promise<UserState> {
  const timeoutPromise = new Promise<UserState>((_, reject) =>
    setTimeout(() => reject(new Error('Firestore Timeout')), 3000)
  );

  const fetchPromise = (async () => {
    try {
      const docRef = doc(db, 'cecilia_states', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserState;
      }
    } catch (e) {
      console.error("Error getting state:", e);
    }
    return { ...DEFAULT_STATE };
  })();

  return Promise.race([fetchPromise, timeoutPromise]).catch(err => {
    console.error(`[Firestore] getUserState failed: ${err.message}`);
    return { ...DEFAULT_STATE };
  });
}

async function saveUserState(userId: string, state: UserState) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Firestore Timeout')), 3000)
  );

  const savePromise = (async () => {
    try {
      const docRef = doc(db, 'cecilia_states', userId);
      await setDoc(docRef, { ...state, lastInteraction: Date.now() });
    } catch (e) {
      console.error("Error saving state:", e);
    }
  })();

  return Promise.race([savePromise, timeoutPromise]).catch(err => {
    console.error(`[Firestore] saveUserState failed: ${err.message}`);
  });
}

function formatPrice(basePrice: number) {
  const withIgv = basePrice * 1.18;
  return `*S/ ${withIgv.toFixed(2)}* _(inc. IGV)_`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Webhook ${requestId}] Received POST request`);
  
  try {
    const body = await request.json();
    console.log(`[Webhook ${requestId}] Body parsed:`, JSON.stringify(body).substring(0, 200));

    let channel: 'wsp' | 'fb' | 'ig' | null = null;
    let senderId = '';
    let messageText = '';

    const entry = body.entry?.[0];
    
    if (entry?.changes?.[0]?.value?.messages?.[0]) {
      const value = entry.changes[0].value;
      channel = 'wsp';
      senderId = value.messages[0].from;
      messageText = value.messages[0].text?.body || '';
      console.log(`[Webhook ${requestId}] Detected WSP message from ${senderId}`);
    } else if (entry?.messaging?.[0]) {
      const messaging = entry.messaging[0];
      senderId = messaging.sender.id;
      messageText = messaging.message?.text || '';
      channel = body.object === 'instagram' ? 'ig' : 'fb';
      console.log(`[Webhook ${requestId}] Detected ${channel.toUpperCase()} message from ${senderId}`);
    }

    if (!channel || !messageText || !senderId) {
      console.log(`[Webhook ${requestId}] Missing channel, text, or senderId. Skipping.`);
      return NextResponse.json({ status: 'NO_MESSAGE_TO_PROCESS' });
    }

    const input = messageText.trim();
    const inputUpper = input.toUpperCase();
    
    console.log(`[Webhook ${requestId}] Getting state for ${senderId}...`);
    let state = await getUserState(senderId);
    console.log(`[Webhook ${requestId}] State retrieved:`, JSON.stringify(state));
    
    let responseText = '';

    // PASO 0: ONBOARDING (NOMBRE)
    if (!state.nombreUsuario) {
      if (state.submodulosVistos.length === 0 && !state.moduloActual) {
        state.submodulosVistos.push('STARTED');
        responseText = "¡Hola! 🤖 Soy Cecilia de **AXYNTRAX**. Estoy lista para automatizar tu negocio.\n\nAntes de empezar, ¿cuál es tu nombre? 😊";
      } else {
        state.nombreUsuario = input;
        responseText = `¡Un gusto, ${state.nombreUsuario}! 🎉\n\nAquí tienes nuestros rubros maestros. Cada uno incluye **3 submódulos GRATIS**.\n\n` + 
          MODULES.map((m, i) => `${i + 1}️⃣ ${m.label}`).join('\n') + 
          `\n\n¿Qué rubro te interesa? Escribe el número.`;
      }
    } 
    // NAVEGACIÓN GLOBAL (Con nombre)
    else if (inputUpper === '0' || inputUpper === 'MENU') {
      state.moduloActual = null;
      state.submoduloActual = null;
      responseText = `*Menú Principal AXYNTRAX* 🚀\n\nHola ${state.nombreUsuario}, elige un rubro para ver sus módulos (incluyen 3 gratis):\n\n` + 
        MODULES.map((m, i) => `${i + 1}️⃣ ${m.label}`).join('\n') + 
        `\n\nEscribe el número del rubro que te interesa.`;
    } 
    else if (inputUpper === 'ATRÁS' || inputUpper === 'VOLVER') {
      if (state.moduloActual) {
        state.submoduloActual = null;
        const mod = MODULES.find(m => m.id === state.moduloActual);
        if (mod) {
          responseText = generateModuleMenu(mod, state.nombreUsuario);
        }
      } else {
        responseText = `${state.nombreUsuario}, ya estás en el menú principal. Elige un rubro:\n\n` + 
          MODULES.map((m, i) => `${i + 1}️⃣ ${m.label}`).join('\n');
      }
    }
    else if (inputUpper === 'TODOS') {
      responseText = `*Lista Completa AXYNTRAX para ${state.nombreUsuario}* 📋\n\n` + 
        MODULES.map(m => `*${m.label}:*\n` + 
          m.free.map(f => `• ${f} (Gratis)`).join('\n') + '\n' +
          m.extras.map(e => `• ${e.name} (${formatPrice(e.price)})`).join('\n')
        ).join('\n\n') + 
        "\n\n⬇️ Regístrate para tu Demo de 30 días en: *www.axyntrax-automation.net*";
    }
    else if (/^\d+$/.test(inputUpper)) {
      const num = parseInt(inputUpper);
      if (!state.moduloActual) {
        if (num >= 1 && num <= MODULES.length) {
          const mod = MODULES[num - 1];
          state.moduloActual = mod.id;
          responseText = generateModuleMenu(mod, state.nombreUsuario);
        } else {
          responseText = `${state.nombreUsuario}, ese número no está en la lista. Elige entre 1 y ${MODULES.length}`;
        }
      } 
      else {
        const mod = MODULES.find(m => m.id === state.moduloActual);
        if (mod) {
          if (num >= 1 && num <= 3) {
            const subName = mod.free[num - 1];
            state.submoduloActual = subName;
            state.submodulosVistos.push(subName);
            responseText = generateSubmoduleDetail(subName, "Submódulo incluido sin costo adicional en tu plan base para potenciar tu productividad desde el día 1.", ["Automatización básica", "Soporte estándar", "Acceso multiusuario"], 0, state.nombreUsuario);
          } else if (num >= 4 && num <= 3 + mod.extras.length) {
            const extra = mod.extras[num - 4];
            state.submoduloActual = extra.name;
            state.submodulosVistos.push(extra.name);
            responseText = generateSubmoduleDetail(extra.name, `Potencia tu ${mod.label} con esta funcionalidad avanzada diseñada para optimizar resultados y ahorrar tiempo real.`, ["Integración total", "Reportes avanzados", "Soporte prioritario"], extra.price, state.nombreUsuario);
          } else {
            responseText = `Lo siento ${state.nombreUsuario}, ese submódulo no existe. Elige entre 1 y ${3 + mod.extras.length}`;
          }
        }
      }
    }
    else if (inputUpper === 'SÍ' || inputUpper === 'SI') {
      if (state.submoduloActual) {
        state.submodulosInteresado.push(state.submoduloActual);
        responseText = `¡Excelente elección, ${state.nombreUsuario}! 🎉\n\nPara activar *${state.submoduloActual}* y empezar tu Demo de 30 días necesito:\n\n📝 Tu nombre completo\n🏢 Nombre de tu empresa\n📱 Tu WhatsApp de contacto\n📧 Tu correo electrónico\n\nUn asesor te contactará en menos de 2 horas y te guiará para la descarga desde nuestra web oficial:\n🌐 *www.axyntrax-automation.net* ✨`;
      } else {
        responseText = `${state.nombreUsuario}, me encantaría ayudarte, pero ¿a qué submódulo te refieres? Elige uno primero o escribe MENU.`;
      }
    }
    else {
      console.log(`[Webhook ${requestId}] Calling askCecilia...`);
      const { reply, metadata } = await askCecilia(`${state.nombreUsuario ? `[Usuario: ${state.nombreUsuario}] ` : ''}${messageText}`, channel);
      console.log(`[Webhook ${requestId}] askCecilia response received.`);
      if (metadata) {
        state.leadTemperature = metadata.temp;
        state.leadIntent = metadata.intent;
        state.resumenNecesidad = metadata.resumen;

        if (metadata.temp === 'HOT') {
          const adminPhone = '51991740590';
          const alertMessage = `🚨 *ALERTA ROJA - LEAD HOT DETECTADO* 🚨\n\n` +
            `👤 *Nombre:* ${state.nombreUsuario || 'Anónimo'}\n` +
            `📱 *WhatsApp:* ${senderId}\n\n` +
            `🧠 *Resumen Cecilia:* "${metadata.resumen}"`;
          
          await sendWhatsAppMessage(adminPhone, alertMessage);

          // Reportar a ATLAS
          await reportToAtlas({
            origen: 'CECILIA',
            tipo: 'LEAD',
            mensaje: `Lead HOT detectado: ${state.nombreUsuario || 'Anónimo'} (${senderId})`,
            prioridad: 3,
            metadata: { senderId, intent: metadata.intent, resumen: metadata.resumen }
          });
        }
      }
      responseText = reply;
    }

    // Reportar actividad general a ATLAS (Async)
    reportToAtlas({
      origen: 'CECILIA',
      tipo: 'MENSAJE',
      mensaje: `Mensaje procesado para ${state.nombreUsuario || senderId} en ${channel}`,
      prioridad: 1
    }).catch(() => {});

    console.log(`[Webhook ${requestId}] Saving final state...`);
    await saveUserState(senderId, state);
    console.log(`[Webhook ${requestId}] State saved.`);

    const wspToken = process.env.WSP_ACCESS_TOKEN;
    const fbToken = process.env.FB_PAGE_ACCESS_TOKEN || process.env.META_GRAPH_ACCESS_TOKEN;
    const igToken = process.env.IG_ACCESS_TOKEN || fbToken;

    const accessToken = channel === 'wsp' ? wspToken : (channel === 'ig' ? igToken : fbToken);
    const phoneId = process.env.WSP_PHONE_NUMBER_ID;

    if (!accessToken) {
      console.error(`[Webhook ${requestId}] Missing access token for channel: ${channel}`);
      return NextResponse.json({ status: 'ERROR_NO_TOKEN', channel });
    }

    let url = '';
    let payload = {};

    if (channel === 'wsp') {
      if (!phoneId) {
        console.error(`[Webhook ${requestId}] Missing WHATSAPP_PHONE_NUMBER_ID / WSP_PHONE_NUMBER_ID`);
        return NextResponse.json({ status: 'ERROR_NO_PHONE_ID' });
      }
      url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      payload = {
        messaging_product: 'whatsapp',
        to: senderId,
        text: { body: responseText }
      };
    } else {
      url = `https://graph.facebook.com/v19.0/me/messages`;
      payload = {
        recipient: { id: senderId },
        message: { text: responseText }
      };
    }

    console.log(`[Webhook ${requestId}] Sending response to ${channel} via ${url}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const metaResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const metaData = await metaResponse.json();
      console.log(`[Webhook ${requestId}] Meta API Response:`, metaResponse.status, JSON.stringify(metaData));
      
      return NextResponse.json({ status: 'SUCCESS', channel, metaStatus: metaResponse.status });
    } catch (metaErr: any) {
      console.error(`[Webhook ${requestId}] Meta API Fetch Error:`, metaErr.message);
      return NextResponse.json({ status: 'META_API_ERROR', error: metaErr.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`[Webhook ${requestId}] Global Error:`, error.message);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}

function generateModuleMenu(mod: any, nombre: string) {
  return `*${mod.label}* 🚀\n\n` +
    `${nombre}, elige un submódulo para ver detalles:\n\n` +
    `*🎁 GRATIS (Plan Base):*\n` +
    mod.free.map((f: string, i: number) => `${i + 1}️⃣ ${f}`).join('\n') +
    `\n\n*💰 EXTRAS (inc. IGV):*\n` +
    mod.extras.map((e: any, i: number) => `${i + 4}️⃣ ${e.name}: ${formatPrice(e.price)}`).join('\n') +
    `\n\nEscribe el número o *0* para volver.`;
}

function generateSubmoduleDetail(name: string, desc: string, features: string[], price: number, nombre: string) {
  const priceStr = price === 0 ? "*GRATIS*" : formatPrice(price);
  return `*${name}* 📋\n\n` +
    `${desc}\n\n` +
    `✅ *Incluye:*\n` +
    features.map(f => `• ${f}`).join('\n') +
    `\n\n💰 *Precio:* ${priceStr}\n\n` +
    `¿Deseas activarlo, ${nombre}? Escribe *SÍ* para soporte o visita:\n` +
    `🌐 *www.axyntrax-automation.net*`;
}
