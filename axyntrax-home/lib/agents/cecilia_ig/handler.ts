import { askDeepSeek } from '../deepseek/client';
import { SYSTEM_PROMPTS } from '../deepseek/prompts';
import { CeciliaMessage } from '@/types/cecilia';

export const handleIgMessage = async (message: string, igsid: string) => {
  const history: CeciliaMessage[] = []; // Espacio para historial de IG

  const messages: CeciliaMessage[] = [
    ...history,
    { role: 'user', content: message }
  ];

  // Instagram suele requerir un tono más visual y directo
  const reply = await askDeepSeek(messages, SYSTEM_PROMPTS.CECILIA_BASE);

  return {
    reply,
    channel: 'instagram' as const,
    recipient: igsid,
    timestamp: new Date().toISOString()
  };
};
