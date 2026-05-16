import { askDeepSeek } from '../deepseek/client';
import { SYSTEM_PROMPTS } from '../deepseek/prompts';
import { CeciliaMessage } from '@/types/cecilia';

/**
 * Handler especializado en LinkedIn.
 * Se enfoca en la generación de mensajes de prospección y respuestas B2B.
 */
export const handleLiMessage = async (context: string, leadInfo?: any) => {
  const history: CeciliaMessage[] = []; // Espacio para historial

  // Prompt específico para LinkedIn (más profesional y enfocado a valor)
  const liPrompt = `${SYSTEM_PROMPTS.CECILIA_BASE}\nActúa como Especialista en Prospección LinkedIn. Tono: Corporativo, Respetuoso, Conciso. No uses spam.`;

  const messages: CeciliaMessage[] = [
    ...history,
    { role: 'user', content: `Genera una respuesta/mensaje para este contexto: ${context}. Información del lead: ${JSON.stringify(leadInfo || {})}` }
  ];

  const reply = await askDeepSeek(messages, liPrompt);

  return {
    reply,
    channel: 'linkedin' as const,
    mode: process.env.LI_ACCESS_TOKEN ? 'live' : 'draft', // Modo borrador si no hay token
    timestamp: new Date().toISOString()
  };
};
