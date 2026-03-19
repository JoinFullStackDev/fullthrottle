import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ChatStreamParams, ChatStreamResult, StreamChunk } from './types';

// ---------------------------------------------------------------------------
// Retry configuration for transient Anthropic errors (429 / 529)
// ---------------------------------------------------------------------------
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;

/**
 * Returns true for errors that are safe to retry:
 *   429 — rate limit exceeded
 *   529 — Anthropic overloaded
 */
function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIStatusError) {
    return err.status === 429 || err.status === 529;
  }
  // Network-level errors (ECONNRESET, ETIMEDOUT, etc.) are also retryable
  if (err instanceof Anthropic.APIConnectionError) return true;
  return false;
}

/**
 * How long to wait before the next attempt.
 * Respects the Retry-After header if present (Anthropic sends it on 429s),
 * otherwise falls back to exponential backoff with jitter.
 */
function retryDelayMs(err: unknown, attempt: number): number {
  if (err instanceof Anthropic.APIStatusError) {
    const retryAfter = err.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseFloat(retryAfter);
      if (!isNaN(seconds)) return seconds * 1_000;
    }
  }
  // Exponential backoff: 1s, 2s, 4s … with ±20% jitter
  const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = base * 0.2 * (Math.random() * 2 - 1);
  return Math.round(base + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    // Disable the SDK's built-in retries — we handle them ourselves so we can
    // surface meaningful errors and respect Retry-After properly.
    this.client = new Anthropic({ apiKey, maxRetries: 0 });
  }

  async chatStream(params: ChatStreamParams): Promise<ChatStreamResult> {
    const { model, systemPrompt, messages, temperature, maxTokens } = params;

    const requestParams = {
      model,
      max_tokens: maxTokens ?? 4096,
      temperature: temperature ?? 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    } as const;

    // Attempt the stream with retries for 429/529 errors.
    let stream: ReturnType<typeof this.client.messages.stream> | null = null;
    let lastErr: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        stream = this.client.messages.stream(requestParams);
        // Trigger a real connection attempt so we catch rate-limit errors here
        // rather than inside the generator where they're harder to handle.
        await stream.done().catch(() => {}); // no-op — we just want the stream open
        // If we reach here without throwing, break out of retry loop
        break;
      } catch (err) {
        lastErr = err;
        if (isRetryable(err) && attempt < MAX_RETRIES) {
          const delay = retryDelayMs(err, attempt);
          console.warn(
            `[AnthropicProvider] Retryable error on attempt ${attempt + 1}/${MAX_RETRIES + 1}. ` +
            `Waiting ${delay}ms before retry. Error: ${err instanceof Error ? err.message : String(err)}`,
          );
          await sleep(delay);
          stream = null;
          continue;
        }
        // Non-retryable or exhausted retries — fall through to error stream below
        break;
      }
    }

    let usage = { promptTokens: 0, completionTokens: 0 };

    // If we never got a working stream, return an error chunk immediately.
    if (!stream) {
      const message = lastErr instanceof Error ? lastErr.message : 'Anthropic request failed';
      const isRateLimit =
        lastErr instanceof Anthropic.APIStatusError &&
        (lastErr.status === 429 || lastErr.status === 529);
      const userMessage = isRateLimit
        ? 'The AI service is temporarily rate-limited. Your message will be available shortly — please try again in a moment.'
        : `AI provider error: ${message}`;

      async function* errorStream(): AsyncGenerator<StreamChunk> {
        yield { type: 'error', content: userMessage };
      }
      return {
        stream: errorStream(),
        getUsage: async () => usage,
      };
    }

    const capturedStream = stream;

    async function* generateChunks(): AsyncGenerator<StreamChunk> {
      try {
        for await (const event of capturedStream) {
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
          const finalMessage = await capturedStream.finalMessage();
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
