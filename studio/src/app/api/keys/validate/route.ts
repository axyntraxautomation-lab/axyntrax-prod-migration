import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { key } = await req.json();
  if (key === process.env.JARVIS_MASTER_KEY) return NextResponse.json({ valid: true });
  return NextResponse.json({ valid: false }, { status: 403 });
}
