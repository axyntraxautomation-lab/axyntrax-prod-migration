import { trackActivity } from '@/lib/atlas/events';
import { askDeepSeek } from '../deepseek/client';
import { SYSTEM_PROMPTS } from '../deepseek/prompts';
import { CeciliaMessage } from '@/types/cecilia';

export const handleWebMessage = async (message: string, history: CeciliaMessage[] = []) => {
  // 1. Notificar a Atlas
  await trackActivity('web', `Usuario consultó: ${message}`);

  const messages: CeciliaMessage[] = [
    ...history,
    { role: 'user', content: message }
  ];

  const reply = await askDeepSeek(messages, SYSTEM_PROMPTS.CECILIA_WEB);

  return {
    reply,
    channel: 'web' as const,
    timestamp: new Date().toISOString()
  };
};
