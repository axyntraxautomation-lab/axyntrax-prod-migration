import { NextResponse } from 'next/server';
import { askDeepSeek, CECILIA_MASTER_PROMPT } from '@/lib/deepseek';
export async function POST(req: Request) {
  const { message } = await req.json();
  const reply = await askDeepSeek(CECILIA_MASTER_PROMPT, message);
  return NextResponse.json({ reply });
}
