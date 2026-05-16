import { NextResponse } from 'next/server';
import { askCecilia } from '@/lib/cecilia-logic';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const reply = await askCecilia(message, 'web');
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Cecilia Neural Failure' }, { status: 500 });
  }
}
