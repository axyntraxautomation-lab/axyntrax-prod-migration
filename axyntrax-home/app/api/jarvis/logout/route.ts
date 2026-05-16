import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sesión JARVIS finalizada." });
  
  // Destruir cookie
  response.cookies.set({
    name: 'jarvis_session',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
