export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { askDeepSeek } from '@/lib/agents/deepseek/client';
import { CECILIA_WSP_PROMPT } from '@/lib/agents/deepseek/prompts';
import { sendWhatsAppMessage, sendMessengerMessage, sendInstagramMessage } from '@/lib/integrations/meta';

// VERIFICACIÓN DE WEBHOOK (META HANDSHAKE)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new Response(challenge, { status: 200 });
    }
  }
  return new Response('Forbidden', { status: 403 });
}

// RECEPCIÓN DE MENSAJES (OMNICANAL: WSP, FB, IG)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK_ENTRY]', JSON.stringify(body, null, 2));

    let senderId = '';
    let messageText = '';
    let channel: 'whatsapp' | 'messenger' | 'instagram' = 'whatsapp';

    // 1. IDENTIFICAR CANAL Y DATOS
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (entry?.text) {
        senderId = entry.from;
        messageText = entry.text.body;
        channel = 'whatsapp';
      }
    } else if (body.object === 'page') {
      // Messenger
      const entry = body.entry?.[0]?.messaging?.[0];
      if (entry?.message?.text) {
        senderId = entry.sender.id;
        messageText = entry.message.text;
        channel = 'messenger';
      }
    } else if (body.object === 'instagram') {
      // Instagram
      const entry = body.entry?.[0]?.messaging?.[0];
      if (entry?.message?.text) {
        senderId = entry.sender.id;
        messageText = entry.message.text;
        channel = 'instagram';
      }
    }

    if (!senderId || !messageText) {
      return NextResponse.json({ status: 'NO_MESSAGE' });
    }

    // 2. RECUPERAR MEMORIA TRANSVERSAL
    const userRef = doc(db, 'cecilia_states', senderId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    const context = userData 
      ? `Canal: ${channel}, Nombre: ${userData.nombreUsuario}, Empresa: ${userData.empresa}, Rubro: ${userData.moduloActual}`
      : `Canal: ${channel}, Cliente nuevo.`;

    // 3. PROCESAMIENTO NEURAL
    const aiResponse = await askDeepSeek([
      { role: 'system', content: CECILIA_WSP_PROMPT.replace('{{context}}', context) },
      { role: 'user', content: messageText }
    ]);

    // 4. REGISTRO EN ATLAS / CRM
    await setDoc(userRef, {
      ...userData,
      ultimoCanal: channel,
      ultimoMensaje: messageText,
      ultimaRespuesta: aiResponse,
      fechaActividad: Date.now()
    }, { merge: true });

    // 5. RESPUESTA OMNICANAL REAL
    try {
      if (channel === 'whatsapp') {
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (phoneId) await sendWhatsAppMessage(phoneId, senderId, aiResponse);
      } else if (channel === 'messenger') {
        await sendMessengerMessage(senderId, aiResponse);
      } else if (channel === 'instagram') {
        await sendInstagramMessage(senderId, aiResponse);
      }
      console.log(`[OMNICANAL] Reply delivered via ${channel} to ${senderId}`);
    } catch (sendError) {
      console.error(`[OMNICANAL_DELIVERY_ERROR]`, sendError);
    }

    return NextResponse.json({ status: 'SUCCESS', channel, reply: aiResponse });

  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
