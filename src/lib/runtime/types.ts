/**
 * Runtime Adapter types per 03_RUNTIME_CONTRACT.md
 *
 * These define the boundary between the Control Center and any future
 * agent runtime (OpenClaw, custom orchestration, etc.). The Control Center
 * codes against these shapes — never against runtime internals.
 */

export interface DateRange {
  start: string;
  end: string;
}

export interface AgentRuntimeStatus {
  agentId: string;
  status: 'online' | 'idle' | 'busy' | 'error' | 'offline';
  lastHeartbeat: string | null;
  currentRunId: string | null;
}

export interface RuntimeTaskPayload {
  taskId: string;
  title: string;
  instructions: string;
  constraints?: string[];
  references?: string[];
  timeout?: number;
}

export interface DispatchResult {
  runId: string;
  status: 'queued' | 'rejected';
  message?: string;
}

export interface TaskRunStatus {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  logs?: string[];
  startedAt?: string;
  completedAt?: string;
}

export interface CancelResult {
  runId: string;
  cancelled: boolean;
  message?: string;
}

export interface ConversationSummary {
  conversationId: string;
  agentId: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface ConversationDetail {
  conversationId: string;
  agentId: string;
  messages: RuntimeMessage[];
  createdAt: string;
}

export interface RuntimeMessage {
  id: string;
  senderType: 'human' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface MessageContext {
  taskId?: string;
  projectTag?: string;
  additionalContext?: Record<string, unknown>;
}

export interface SendMessageResult {
  messageId: string;
  status: 'sent' | 'failed';
  response?: string;
}

export interface RuntimeUsageEvent {
  id: string;
  agentId: string;
  model: string;
  tokens: number;
  cost: number;
  timestamp: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  byAgent: Array<{
    agentId: string;
    tokens: number;
    cost: number;
  }>;
  byModel: Array<{
    model: string;
    tokens: number;
    cost: number;
  }>;
  range: DateRange;
}

export interface RuntimeHealth {
  healthy: boolean;
  gatewayVersion: string;
  uptime: number;
  errorRates: {
    last5m: number;
    last1h: number;
    last24h: number;
  };
}

export interface RuntimeAdapter {
  getAgentStatus(agentId: string): Promise<AgentRuntimeStatus>;
  listAgentsStatus(): Promise<AgentRuntimeStatus[]>;

  listConversations(agentId: string, since?: string): Promise<ConversationSummary[]>;
  getConversation(conversationId: string): Promise<ConversationDetail>;
  sendMessage(agentId: string, message: string, context?: MessageContext): Promise<SendMessageResult>;

  dispatchTask(agentId: string, task: RuntimeTaskPayload): Promise<DispatchResult>;
  getTaskRunStatus(runId: string): Promise<TaskRunStatus>;
  cancelTaskRun(runId: string): Promise<CancelResult>;

  listUsage(agentId: string, range: DateRange): Promise<RuntimeUsageEvent[]>;
  getUsageSummary(range: DateRange): Promise<UsageSummary>;

  getRuntimeHealth(): Promise<RuntimeHealth>;
}
