export interface CeciliaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CeciliaResponse {
  reply: string;
  channel: 'web' | 'whatsapp' | 'facebook' | 'instagram' | 'linkedin';
  metadata?: any;
}

export type CeciliaChannel = 'web' | 'whatsapp' | 'facebook' | 'instagram' | 'linkedin';
