import { askDeepSeek } from '../deepseek/client';
import { SYSTEM_PROMPTS } from '../deepseek/prompts';
import { CeciliaMessage } from '@/types/cecilia';

export const handleFbMessage = async (message: string, psid: string) => {
  const history: CeciliaMessage[] = []; // Espacio para historial de FB

  const messages: CeciliaMessage[] = [
    ...history,
    { role: 'user', content: message }
  ];

  const reply = await askDeepSeek(messages, SYSTEM_PROMPTS.CECILIA_BASE);

  return {
    reply,
    channel: 'facebook' as const,
    recipient: psid,
    timestamp: new Date().toISOString()
  };
};
