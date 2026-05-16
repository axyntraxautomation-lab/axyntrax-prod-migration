import { NextResponse } from 'next/server';
import { orchestrateKeyDelivery } from '@/lib/jarvis/keygen';

/**
 * Endpoint de Generación - SANITIZADO
 */
export async function POST(req: Request) {
  try {
    const { clientId, contact, secret } = await req.json();

    // 1. Validación de Secreto
    if (secret !== process.env.AGENT_SECRET_KEY) {
      console.error('[SECURITY_ALERT] Unauthorized keygen attempt');
      return NextResponse.json({ error: 'Access Denied' }, { status: 401 });
    }

    // 2. Orquestación
    const result = await orchestrateKeyDelivery(clientId, contact);

    // 3. Respuesta Segura (No enviamos la llave real al dashboard)
    return NextResponse.json({
      success: true,
      status: 'DELIVERED',
      expiresAt: result.expiresAt
    });

  } catch (error: any) {
    // 4. Sanitización de Errores: Nunca enviar trazas al frontend
    console.error('[INTERNAL_ERROR] Keygen failure:', error.message);
    return NextResponse.json({ 
      error: 'Proceso de licenciamiento fallido. Contacte al administrador.' 
    }, { status: 500 });
  }
}
