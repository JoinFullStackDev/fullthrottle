import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Integration } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type IntegrationRow = Tables<'integrations'>;

const INTEGRATION_COLUMNS = 'id, type, agent_id, status, config, created_by, updated_by, created_at, updated_at' as const;

function rowToIntegration(
  row: IntegrationRow,
  hasCredentials: boolean,
  agentName?: string,
): Integration {
  return {
    id: row.id,
    type: row.type,
    agentId: row.agent_id,
    agentName,
    status: row.status,
    config: (row.config ?? {}) as Record<string, unknown>,
    hasCredentials,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchCredentialFlags(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  integrationIds: string[],
): Promise<Set<string>> {
  if (integrationIds.length === 0) return new Set();
  const { data } = await supabase
    .from('integration_credentials')
    .select('integration_id')
    .in('integration_id', integrationIds);
  return new Set((data ?? []).map((r) => r.integration_id));
}

export async function listIntegrations(): Promise<Integration[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('integrations')
    .select(`${INTEGRATION_COLUMNS}, agents(name)`)
    .order('type')
    .order('created_at');

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as (IntegrationRow & { agents: { name: string } | null })[];
  const credSet = await fetchCredentialFlags(supabase, rows.map((r) => r.id));

  return rows.map((row) =>
    rowToIntegration(row, credSet.has(row.id), row.agents?.name ?? undefined),
  );
}

export async function listIntegrationsByType(type: IntegrationRow['type']): Promise<Integration[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('integrations')
    .select(`${INTEGRATION_COLUMNS}, agents(name)`)
    .eq('type', type)
    .order('created_at');

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as (IntegrationRow & { agents: { name: string } | null })[];
  const credSet = await fetchCredentialFlags(supabase, rows.map((r) => r.id));

  return rows.map((row) =>
    rowToIntegration(row, credSet.has(row.id), row.agents?.name ?? undefined),
  );
}

export async function getIntegration(id: string): Promise<Integration | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('integrations')
    .select(`${INTEGRATION_COLUMNS}, agents(name)`)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  const row = data as IntegrationRow & { agents: { name: string } | null };
  const credSet = await fetchCredentialFlags(supabase, [row.id]);
  return rowToIntegration(row, credSet.has(row.id), row.agents?.name ?? undefined);
}
