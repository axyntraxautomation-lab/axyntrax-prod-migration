import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Credenciales Hardcoded para acceso exclusivo CEO
    if (username === 'jarvis' && password === 'viernes') {
      const response = NextResponse.json({ success: true, message: "Protocolo JARVIS aceptado." });
      
      // Seteo de cookie segura httpOnly
      response.cookies.set({
        name: 'jarvis_session',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 12, // 12 horas
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ success: false, message: "Acceso denegado. Credenciales inválidas." }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error interno en el servidor JARVIS." }, { status: 500 });
  }
}
