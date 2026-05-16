import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    // 1. Verificar Token de Seguridad (Para que no cualquiera llame al cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MASTER_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const targetDate = now - threeDaysMs;

    // Buscamos usuarios registrados hace aprox 3 días que no hayan recibido el followup
    // Nota: En Firestore, para un cron simple, traemos los que followup_3d_sent === false
    const q = query(
      collection(db, 'cecilia_states'), 
      where('followup_3d_sent', '==', false)
    );

    const querySnapshot = await getDocs(q);
    let sentCount = 0;

    const accessToken = process.env.META_ACCESS_TOKEN || process.env.WSP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WSP_PHONE_NUMBER_ID;

    for (const userDoc of querySnapshot.docs) {
      const data = userDoc.data();
      const regDate = data.fechaRegistro;

      // Si pasaron más de 3 días desde el registro
      if (regDate && (now - regDate) >= threeDaysMs) {
        const telefono = userDoc.id;
        const nombre = data.nombreUsuario || 'amigo';

        const message = `¡Hola ${nombre}! 👋 Soy Cecilia de AXYNTRAX.

Hace 3 días que activaste tu demo y quería saber: ¿Cómo va todo con la instalación? 🤖

Recuerda que estoy aquí 24/7 para ayudarte con cualquier duda técnica. Si ya lograste instalarlo, ¡genial! Si no, dime qué problema tuviste y lo resolvemos juntos ahora mismo.

¿Te gustaría que te envíe la guía rápida de configuración? 🚀`;

        if (accessToken && phoneId) {
          await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: telefono,
              type: 'text',
              text: { body: message }
            })
          });

          // Marcar como enviado
          await updateDoc(doc(db, 'cecilia_states', userDoc.id), {
            followup_3d_sent: true
          });
          sentCount++;
        }
      }
    }

    return NextResponse.json({ status: 'SUCCESS', sentCount });

  } catch (error) {
    console.error('Followup Cron Error:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
