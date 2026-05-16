import { askDeepSeek } from '../deepseek/client';
import { SYSTEM_PROMPTS } from '../deepseek/prompts';
import { formatWspText } from './formatter';
import { CeciliaMessage } from '@/types/cecilia';

export const handleWspMessage = async (message: string, phoneNumber: string) => {
  // En un sistema real, aquí recuperarías el historial de Firebase/Supabase usando phoneNumber
  const history: CeciliaMessage[] = []; 

  const messages: CeciliaMessage[] = [
    ...history,
    { role: 'user', content: message }
  ];

  const rawReply = await askDeepSeek(messages, SYSTEM_PROMPTS.CECILIA_WSP);
  const formattedReply = formatWspText(rawReply);

  return {
    reply: formattedReply,
    channel: 'whatsapp' as const,
    recipient: phoneNumber,
    timestamp: new Date().toISOString()
  };
};
