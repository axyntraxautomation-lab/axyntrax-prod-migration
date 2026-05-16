export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { handleWebMessage } from '@/lib/agents/cecilia_web';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const response = await handleWebMessage(message, history || []);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API Error /api/cecilia/chat:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor de IA', details: error.message }, 
      { status: 500 }
    );
  }
}
