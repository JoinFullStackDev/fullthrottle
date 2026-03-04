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
