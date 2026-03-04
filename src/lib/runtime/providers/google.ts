import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, ChatStreamParams, ChatStreamResult, StreamChunk } from './types';

export class GoogleProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chatStream(params: ChatStreamParams): Promise<ChatStreamResult> {
    const { model, systemPrompt, messages, temperature, maxTokens } = params;

    const genModel = this.genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: temperature ?? 0.7,
        maxOutputTokens: maxTokens ?? 4096,
      },
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = genModel.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage?.content ?? '');

    let totalTokens = { promptTokens: 0, completionTokens: 0 };

    async function* generateChunks(): AsyncGenerator<StreamChunk> {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield { type: 'text', content: text };
          }
        }

        yield { type: 'done', content: '' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google AI stream error';
        yield { type: 'error', content: message };
      }
    }

    return {
      stream: generateChunks(),
      getUsage: async () => {
        try {
          const response = await result.response;
          const meta = response.usageMetadata;
          if (meta) {
            totalTokens = {
              promptTokens: meta.promptTokenCount ?? 0,
              completionTokens: meta.candidatesTokenCount ?? 0,
            };
          }
        } catch {
          // Usage may not be available
        }
        return totalTokens;
      },
    };
  }
}
