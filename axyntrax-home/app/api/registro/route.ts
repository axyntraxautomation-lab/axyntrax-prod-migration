import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { nombre, empresa, telefono } = await request.json();

    if (!nombre || !telefono) {
      return NextResponse.json({ status: 'ERROR', message: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Generar Key Aleatoria
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const demoKey = `AX-DEMO-${randomHex}`;

    // 2. Guardar en Firestore para seguimiento
    const userId = telefono; // Usamos el teléfono como ID
    await setDoc(doc(db, 'cecilia_states', userId), {
      nombreUsuario: nombre,
      empresa,
      telefono,
      demoKey,
      fechaRegistro: Date.now(),
      followup_3d_sent: false,
      moduloActual: null,
      submoduloActual: null,
      submodulosVistos: [],
      submodulosInteresado: []
    });

    // 2. Preparar mensaje para WhatsApp
    const accessToken = process.env.META_ACCESS_TOKEN || process.env.WSP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WSP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneId) {
      console.error('Meta credentials missing');
      return NextResponse.json({ status: 'SUCCESS_LOCAL_ONLY', demoKey });
    }

    const message = `¡Hola ${nombre}! 🤖 Soy Cecilia de AXYNTRAX AUTOMATION.

Tu solicitud de demo ha sido aprobada por JARVIS. Aquí tienes tu llave de acceso para los próximos 30 días:

🔑 *KEY:* ${demoKey}
🏢 *EMPRESA:* ${empresa}

Puedes descargar los módulos y activarlos con esta llave desde:
🌐 www.axyntrax-automation.net

¡Bienvenido a la red de orquestación inteligente! 🚀`;

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'text',
      text: { body: message }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('WhatsApp Key Delivery Result:', result);

    // 4. Placeholder para Envío de Email (Requiere API Key de Resend/SendGrid)
    // import { getWelcomeEmailHtml } from '@/lib/email-templates';
    // const emailHtml = getWelcomeEmailHtml(nombre, empresa, demoKey);
    // await sendEmail(email, "¡Bienvenido a Axyntrax!", emailHtml);

    return NextResponse.json({ 
      status: 'SUCCESS', 
      demoKey,
      message: 'Registro exitoso. Cecilia ha enviado la KEY por WhatsApp.' 
    });

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
