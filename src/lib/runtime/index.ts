export type { RuntimeAdapter } from './types';
export type {
  AgentRuntimeStatus,
  RuntimeTaskPayload,
  DispatchResult,
  TaskRunStatus,
  CancelResult,
  ConversationSummary,
  ConversationDetail,
  RuntimeMessage,
  MessageContext,
  SendMessageResult,
  RuntimeUsageEvent,
  UsageSummary,
  RuntimeHealth,
  DateRange,
} from './types';

export { StubRuntimeAdapter, stubAdapter } from './stub-adapter';
export { DirectLLMAdapter } from './direct-llm-adapter';

import type { RuntimeAdapter } from './types';
import { StubRuntimeAdapter } from './stub-adapter';
import { DirectLLMAdapter } from './direct-llm-adapter';

let cachedAdapter: RuntimeAdapter | null = null;

export function getRuntimeAdapter(): RuntimeAdapter {
  if (cachedAdapter) return cachedAdapter;

  const mode = process.env.RUNTIME_MODE ?? 'stub';

  if (mode === 'direct-llm') {
    cachedAdapter = new DirectLLMAdapter();
  } else {
    cachedAdapter = new StubRuntimeAdapter();
  }

  return cachedAdapter;
}
