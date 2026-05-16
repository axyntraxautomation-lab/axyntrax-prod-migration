import { NextResponse } from 'next/server';
import { askCecilia } from '@/lib/cecilia/cecilia-logic';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { reply } = await askCecilia(message, 'web');

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('[API Chat] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
