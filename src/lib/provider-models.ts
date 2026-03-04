export const PROVIDER_MODELS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  anthropic: {
    label: 'Anthropic',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'o3', label: 'o3' },
      { value: 'o3-mini', label: 'o3 Mini' },
      { value: 'o4-mini', label: 'o4 Mini' },
    ],
  },
  google: {
    label: 'Google (Gemini)',
    models: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
};

export const PROVIDER_OPTIONS = Object.entries(PROVIDER_MODELS).map(([value, { label }]) => ({ value, label }));
