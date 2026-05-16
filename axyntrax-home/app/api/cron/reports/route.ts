import { NextResponse } from 'next/server';
import { getSummaryForMaster } from '@/lib/agents/memory';
import { askDeepSeek } from '@/lib/agents/deepseek';

/**
 * Daily Report Worker: Genera el resumen ejecutivo para el Gerente.
 */
export async function GET() {
  try {
    const activity = getSummaryForMaster();
    
    if (!activity) {
      return NextResponse.json({ message: "No hay actividad suficiente para generar reporte." });
    }

    const reportPrompt = `Actúa como Gerente de Operaciones AXYNTRAX. 
Resume la siguiente actividad de los agentes en un reporte ejecutivo de 3 puntos y da un consejo estratégico:
${activity}`;

    const report = await askDeepSeek([{ role: 'user', content: 'Genera el reporte diario.' }], reportPrompt);

    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      executive_summary: report,
      status: "GENERATED"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
