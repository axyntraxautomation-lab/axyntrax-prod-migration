import OpenAI from 'openai';
import { CeciliaMessage } from '@/types/cecilia';
import { SYSTEM_PROMPTS } from './prompts';
import { checkRateLimit, THRESHOLDS } from './limiter';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

// Circuit Breaker State
let isCircuitOpen = false;
let lastErrorTime = 0;
const COOLDOWN_MS = 60000;

export const askDeepSeek = async (
  messages: CeciliaMessage[],
  systemPrompt: string = SYSTEM_PROMPTS.CECILIA_BASE
) => {
  // 1. Validar Límite Global (45 req/min)
  const globalCheck = checkRateLimit('GLOBAL', THRESHOLDS.GLOBAL);
  if (!globalCheck.allowed) {
    throw new Error('Límite global de peticiones alcanzado. Reintentar en un minuto.');
  }

  // 2. Verificar Circuit Breaker
  if (isCircuitOpen && Date.now() - lastErrorTime < COOLDOWN_MS) {
    throw new Error('Neural Core en modo Cooldown tras fallo crítico.');
  }

  try {
    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: m.content.slice(0, 2000)
    }));

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...sanitizedMessages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    isCircuitOpen = false;
    return response.choices[0].message.content || 'Sin respuesta.';
  } catch (error: any) {
    console.error('DeepSeek Error:', error.message);
    isCircuitOpen = true;
    lastErrorTime = Date.now();
    throw new Error('Error de comunicación con el núcleo neural.');
  }
};
