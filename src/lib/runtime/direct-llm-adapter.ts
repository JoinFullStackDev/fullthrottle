import { createServiceRoleClient } from '@/lib/supabase/server';
import { processAgentMessageSync } from './message-pipeline';
import type { Tables } from '@/lib/supabase/database.types';
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
  RuntimeMessage,
} from './types';

/**
 * Direct LLM implementation of RuntimeAdapter.
 * Calls LLM providers directly instead of routing through an external gateway.
 */
export class DirectLLMAdapter implements RuntimeAdapter {
  async getAgentStatus(agentId: string): Promise<AgentRuntimeStatus> {
    return {
      agentId,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      currentRunId: null,
    };
  }

  async listAgentsStatus(): Promise<AgentRuntimeStatus[]> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from('agents').select('id');
    return (data ?? []).map((a) => ({
      agentId: a.id,
      status: 'online' as const,
      lastHeartbeat: new Date().toISOString(),
      currentRunId: null,
    }));
  }

  async listConversations(agentId: string, _since?: string): Promise<ConversationSummary[]> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('conversations')
      .select('id, agent_id, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(50);

    return (data ?? []).map((c) => ({
      conversationId: c.id,
      agentId: c.agent_id ?? agentId,
      messageCount: 0,
      lastMessageAt: c.created_at,
      createdAt: c.created_at,
    }));
  }

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    const supabase = createServiceRoleClient();
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, agent_id, created_at')
      .eq('id', conversationId)
      .single();

    const { data: msgs } = await supabase
      .from('conversation_messages')
      .select('id, sender_type, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at');

    const messages: RuntimeMessage[] = (msgs ?? []).map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      content: m.content,
      timestamp: m.created_at,
      metadata: m.metadata as Record<string, unknown> | undefined,
    }));

    return {
      conversationId,
      agentId: conv?.agent_id ?? '',
      messages,
      createdAt: conv?.created_at ?? new Date().toISOString(),
    };
  }

  async sendMessage(
    agentId: string,
    message: string,
    context?: MessageContext,
  ): Promise<SendMessageResult> {
    const supabase = createServiceRoleClient();

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        created_by: '00000000-0000-0000-0000-000000000000',
        channel: 'web',
        title: message.slice(0, 100),
      } as never)
      .select('id')
      .single();

    if (convError || !conv) {
      return {
        messageId: '',
        status: 'failed',
        response: convError?.message ?? 'Failed to create conversation',
      };
    }

    try {
      const response = await processAgentMessageSync({
        agentId,
        conversationId: (conv as { id: string }).id,
        userMessage: message,
        userId: '00000000-0000-0000-0000-000000000000',
        channel: context?.taskId ? 'web' : 'web',
      });

      return {
        messageId: (conv as { id: string }).id,
        status: 'sent',
        response,
      };
    } catch (err) {
      return {
        messageId: '',
        status: 'failed',
        response: err instanceof Error ? err.message : 'LLM call failed',
      };
    }
  }

  async dispatchTask(_agentId: string, _task: RuntimeTaskPayload): Promise<DispatchResult> {
    return {
      runId: '',
      status: 'rejected',
      message: 'Task dispatch not yet supported in direct-llm mode.',
    };
  }

  async getTaskRunStatus(runId: string): Promise<TaskRunStatus> {
    return {
      runId,
      status: 'failed',
      logs: ['Task runs not yet supported in direct-llm mode.'],
    };
  }

  async cancelTaskRun(runId: string): Promise<CancelResult> {
    return {
      runId,
      cancelled: false,
      message: 'Task runs not yet supported in direct-llm mode.',
    };
  }

  async listUsage(agentId: string, range: DateRange): Promise<RuntimeUsageEvent[]> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('usage_events')
      .select('id, agent_id, model, token_count, cost_estimate, timestamp')
      .eq('agent_id', agentId)
      .gte('timestamp', range.start)
      .lte('timestamp', range.end)
      .order('timestamp', { ascending: false });

    type UsageRow = Tables<'usage_events'>;
    return ((data ?? []) as UsageRow[]).map((e) => ({
      id: e.id,
      agentId: e.agent_id,
      model: e.model,
      tokens: e.token_count,
      cost: Number(e.cost_estimate),
      timestamp: e.timestamp,
    }));
  }

  async getUsageSummary(range: DateRange): Promise<UsageSummary> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('usage_events')
      .select('id, agent_id, model, token_count, cost_estimate, timestamp')
      .gte('timestamp', range.start)
      .lte('timestamp', range.end);

    type UsageRow = Tables<'usage_events'>;
    const events = (data ?? []) as UsageRow[];
    const totalTokens = events.reduce((sum, e) => sum + e.token_count, 0);
    const totalCost = events.reduce((sum, e) => sum + Number(e.cost_estimate), 0);

    const byAgentMap = new Map<string, { tokens: number; cost: number }>();
    const byModelMap = new Map<string, { tokens: number; cost: number }>();

    for (const e of events) {
      const ag = byAgentMap.get(e.agent_id) ?? { tokens: 0, cost: 0 };
      ag.tokens += e.token_count;
      ag.cost += Number(e.cost_estimate);
      byAgentMap.set(e.agent_id, ag);

      const md = byModelMap.get(e.model) ?? { tokens: 0, cost: 0 };
      md.tokens += e.token_count;
      md.cost += Number(e.cost_estimate);
      byModelMap.set(e.model, md);
    }

    return {
      totalTokens,
      totalCost,
      byAgent: Array.from(byAgentMap, ([agentId, v]) => ({ agentId, ...v })),
      byModel: Array.from(byModelMap, ([model, v]) => ({ model, ...v })),
      range,
    };
  }

  async getRuntimeHealth(): Promise<RuntimeHealth> {
    return {
      healthy: true,
      gatewayVersion: 'direct-llm-1.0.0',
      uptime: process.uptime(),
      errorRates: { last5m: 0, last1h: 0, last24h: 0 },
    };
  }
}
