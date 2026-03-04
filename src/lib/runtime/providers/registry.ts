import type { LLMProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';

const providers = new Map<string, LLMProvider>();

export function getProvider(name: string): LLMProvider {
  const cached = providers.get(name);
  if (cached) return cached;

  let provider: LLMProvider;

  switch (name) {
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
      provider = new AnthropicProvider(key);
      break;
    }
    case 'google': {
      const key = process.env.GOOGLE_AI_API_KEY;
      if (!key) throw new Error('GOOGLE_AI_API_KEY is not set');
      provider = new GoogleProvider(key);
      break;
    }
    default:
      throw new Error(`Unknown LLM provider: ${name}`);
  }

  providers.set(name, provider);
  return provider;
}
