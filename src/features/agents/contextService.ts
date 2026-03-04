import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { AgentContext } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type ContextRow = Tables<'agent_context'>;

function rowToContext(row: ContextRow): AgentContext {
  return {
    id: row.id,
    agentId: row.agent_id,
    key: row.key,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAgentContext(agentId: string): Promise<AgentContext[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('agent_context')
    .select('*')
    .eq('agent_id', agentId)
    .order('key');

  if (error) throw new Error(error.message);
  return ((data ?? []) as ContextRow[]).map(rowToContext);
}

export async function upsertAgentContext(
  agentId: string,
  key: string,
  value: string,
): Promise<AgentContext> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('agent_context')
    .upsert(
      { agent_id: agentId, key, value },
      { onConflict: 'agent_id,key' },
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToContext(data as ContextRow);
}

export async function deleteAgentContext(id: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from('agent_context')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function bulkSaveAgentContext(
  agentId: string,
  entries: { key: string; value: string }[],
): Promise<AgentContext[]> {
  const supabase = createBrowserSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('agent_context')
    .select('*')
    .eq('agent_id', agentId);

  if (fetchErr) throw new Error(fetchErr.message);

  const existingRows = (existing ?? []) as ContextRow[];
  const submittedKeys = new Set(entries.map((e) => e.key));

  const toDelete = existingRows.filter((r) => !submittedKeys.has(r.key));
  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('agent_context')
      .delete()
      .in('id', toDelete.map((r) => r.id));
    if (delErr) throw new Error(delErr.message);
  }

  if (entries.length === 0) return [];

  const { data, error } = await supabase
    .from('agent_context')
    .upsert(
      entries.map((e) => ({ agent_id: agentId, key: e.key, value: e.value })),
      { onConflict: 'agent_id,key' },
    )
    .select('*');

  if (error) throw new Error(error.message);
  return ((data ?? []) as ContextRow[]).map(rowToContext);
}
