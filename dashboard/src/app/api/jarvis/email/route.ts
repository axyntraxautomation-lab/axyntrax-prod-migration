import { NextResponse } from 'next/server';
import { askDeepSeek } from '@/lib/deepseek';

const JARVIS_EMAIL_PROMPT = `Eres JARVIS, asistente ejecutivo del dueño de Axyntrax Automation.
Manejas el correo axyntraxautomation@gmail.com.
Analizas cada correo y respondes en nombre del gerente, hilando la conversación.
Redactas respuestas profesionales, cálidas, y das seguimiento a cada hilo.
Si detectas una oportunidad de venta, la destacas.
Servicios clave: diseñar páginas web y cotizar dominios, además de automatización de flujos.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { from, subject, text } = body; // Resend envía estos campos vía webhook
    
    const reply = await askDeepSeek(JARVIS_EMAIL_PROMPT, `Correo de ${from}: ${subject}\n\n${text}`);
    
    // El Dashboard registra la respuesta de JARVIS y podría despachar vía Resend SDK aquí
    console.log("[JARVIS EMAIL] Respuesta generada:", reply);
    
    return NextResponse.json({ 
        success: true, 
        status: "Replied by JARVIS", 
        reply: reply 
    });
  } catch (error: any) {
      console.error("[JARVIS EMAIL ERROR]", error);
      return NextResponse.json({ error: "Failed to process email webhook" }, { status: 500 });
  }
}
