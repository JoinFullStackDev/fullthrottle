import type {
  RuntimeAdapter,
  AgentRuntimeStatus,
  ConversationSummary,
  ConversationDetail,
  SendMessageResult,
  RuntimeTaskPayload,
  DispatchResult,
  TaskRunStatus,
  CancelResult,
  RuntimeUsageEvent,
  UsageSummary,
  RuntimeHealth,
  DateRange,
  MessageContext,
} from './types';

/**
 * Stub implementation of RuntimeAdapter.
 * Returns placeholder data for all methods. Used during Phase 1
 * when no agent runtime is connected.
 */
export class StubRuntimeAdapter implements RuntimeAdapter {
  async getAgentStatus(agentId: string): Promise<AgentRuntimeStatus> {
    return {
      agentId,
      status: 'offline',
      lastHeartbeat: null,
      currentRunId: null,
    };
  }

  async listAgentsStatus(): Promise<AgentRuntimeStatus[]> {
    return [];
  }

  async listConversations(_agentId: string, _since?: string): Promise<ConversationSummary[]> {
    return [];
  }

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    return {
      conversationId,
      agentId: '',
      messages: [],
      createdAt: new Date().toISOString(),
    };
  }

  async sendMessage(_agentId: string, _message: string, _context?: MessageContext): Promise<SendMessageResult> {
    return {
      messageId: '',
      status: 'failed',
      response: 'Runtime not connected. Stub adapter active.',
    };
  }

  async dispatchTask(_agentId: string, _task: RuntimeTaskPayload): Promise<DispatchResult> {
    return {
      runId: '',
      status: 'rejected',
      message: 'Runtime not connected. Stub adapter active.',
    };
  }

  async getTaskRunStatus(runId: string): Promise<TaskRunStatus> {
    return {
      runId,
      status: 'failed',
      logs: ['Runtime not connected. Stub adapter active.'],
    };
  }

  async cancelTaskRun(runId: string): Promise<CancelResult> {
    return {
      runId,
      cancelled: false,
      message: 'Runtime not connected. Stub adapter active.',
    };
  }

  async listUsage(_agentId: string, _range: DateRange): Promise<RuntimeUsageEvent[]> {
    return [];
  }

  async getUsageSummary(range: DateRange): Promise<UsageSummary> {
    return {
      totalTokens: 0,
      totalCost: 0,
      byAgent: [],
      byModel: [],
      range,
    };
  }

  async getRuntimeHealth(): Promise<RuntimeHealth> {
    return {
      healthy: false,
      gatewayVersion: 'stub-0.0.0',
      uptime: 0,
      errorRates: {
        last5m: 0,
        last1h: 0,
        last24h: 0,
      },
    };
  }
}

export const stubAdapter = new StubRuntimeAdapter();
