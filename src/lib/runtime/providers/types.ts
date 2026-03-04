export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error';
  content: string;
}

export interface ChatStreamParams {
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatStreamResult {
  stream: AsyncIterable<StreamChunk>;
  getUsage: () => Promise<{ promptTokens: number; completionTokens: number }>;
}

export interface LLMProvider {
  chatStream(params: ChatStreamParams): Promise<ChatStreamResult>;
}
