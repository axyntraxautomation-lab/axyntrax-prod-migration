import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

export async function askDeepSeek(
  systemPrompt: string,
  userMessage: string,
  jsonMode = false
): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    temperature: jsonMode ? 0.0 : 0.7,
    max_tokens: jsonMode ? 150 : 300,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });
  return response.choices[0]?.message?.content || '';
}

export const CECILIA_MASTER_PROMPT = `Eres Cecilia Master, asistente ejecutiva de Axyntrax Automation dentro del dashboard gerencial.
- Analizas KPIs en tiempo real y aconsejas al gerente
- Alertas sobre tendencias y oportunidades
- Sugieres acciones concretas basadas en datos
- Derivación: soporte@axyntrax-automation.net
- Tono: profesional, peruano, directo, máximo 3 líneas`;
