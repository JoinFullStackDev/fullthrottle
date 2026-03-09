import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { UsageEvent } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type UsageRow = Tables<'usage_events'>;

function rowToUsageEvent(row: UsageRow): UsageEvent {
  return {
    id: row.id,
    agentId: row.agent_id,
    model: row.model,
    tokenCount: row.token_count,
    costEstimate: row.cost_estimate,
    timestamp: row.timestamp,
  };
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  activeAgentIds: string[];
  events: UsageEvent[];
}

export async function listUsageEvents(): Promise<UsageEvent[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('usage_events')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return ((data ?? []) as UsageRow[]).map(rowToUsageEvent);
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const events = await listUsageEvents();
  const totalTokens = events.reduce((sum, e) => sum + e.tokenCount, 0);
  const totalCost = events.reduce((sum, e) => sum + Number(e.costEstimate), 0);
  const activeAgentIds = Array.from(new Set(events.map((e) => e.agentId)));
  return { totalTokens, totalCost, activeAgentIds, events };
}
