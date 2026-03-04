export type { Conversation, ConversationMessage } from '@/lib/types';
export type { SenderTypeValue } from '@/lib/constants';

export interface DocumentCitation {
  name: string;
  sourceType: string;
  status?: 'fresh' | 'stale' | 'error';
}
