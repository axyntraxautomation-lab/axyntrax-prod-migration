import { NextResponse } from 'next/server';
import { handleLiMessage } from '@/lib/agents/cecilia_li';

/**
 * API para acciones de LinkedIn (Prospección y Seguimiento)
 */
export async function POST(req: Request) {
  try {
    const { context, leadInfo } = await req.json();

    if (!context) {
      return NextResponse.json({ error: 'Contexto requerido' }, { status: 400 });
    }

    // Generar respuesta/mensaje de LinkedIn
    const response = await handleLiMessage(context, leadInfo);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('LinkedIn API Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * Health check para integración LinkedIn
 */
export async function GET() {
  const isLinked = !!process.env.LI_ACCESS_TOKEN;
  return NextResponse.json({ 
    status: isLinked ? 'connected' : 'manual_mode',
    channel: 'linkedin' 
  });
}
