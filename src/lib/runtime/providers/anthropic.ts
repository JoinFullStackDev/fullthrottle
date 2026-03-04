import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ChatStreamParams, ChatStreamResult, StreamChunk } from './types';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chatStream(params: ChatStreamParams): Promise<ChatStreamResult> {
    const { model, systemPrompt, messages, temperature, maxTokens } = params;

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens ?? 4096,
      temperature: temperature ?? 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    let usage = { promptTokens: 0, completionTokens: 0 };

    async function* generateChunks(): AsyncGenerator<StreamChunk> {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            yield { type: 'text', content: event.delta.text };
          }

          if (event.type === 'message_delta' && event.usage) {
            usage.completionTokens = event.usage.output_tokens;
          }

          if (event.type === 'message_start' && event.message.usage) {
            usage.promptTokens = event.message.usage.input_tokens;
          }
        }

        yield { type: 'done', content: '' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Anthropic stream error';
        yield { type: 'error', content: message };
      }
    }

    return {
      stream: generateChunks(),
      getUsage: async () => {
        try {
          const finalMessage = await stream.finalMessage();
          return {
            promptTokens: finalMessage.usage.input_tokens,
            completionTokens: finalMessage.usage.output_tokens,
          };
        } catch {
          return usage;
        }
      },
    };
  }
}
