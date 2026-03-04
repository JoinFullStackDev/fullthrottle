import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Agent } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';
import { createAuditEntry } from '@/features/audit/service';

type AgentRow = Tables<'agents'>;

function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    description: row.description,
    basePersonaVersion: row.base_persona_version,
    status: row.status,
    defaultModel: row.default_model,
    provider: row.provider,
    runtimeAgentId: row.runtime_agent_id,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAgents(): Promise<Agent[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return ((data ?? []) as AgentRow[]).map(rowToAgent);
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return rowToAgent(data as AgentRow);
}

interface AuditContext {
  actorId: string;
  reason: string;
}

type CreateAgentInput = Pick<Agent, 'name' | 'role' | 'description' | 'status' | 'defaultModel' | 'provider' | 'basePersonaVersion'>;

export async function createAgent(
  input: CreateAgentInput,
  audit?: AuditContext,
): Promise<Agent> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from('agents')
    .insert({
      name: input.name,
      role: input.role,
      description: input.description,
      status: input.status,
      default_model: input.defaultModel,
      provider: input.provider,
      base_persona_version: input.basePersonaVersion,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const created = rowToAgent(data as AgentRow);

  if (audit) {
    await createAuditEntry({
      actorId: audit.actorId,
      actionType: 'agent_created',
      entityType: 'Agent',
      entityId: created.id,
      beforeState: null,
      afterState: { name: created.name, role: created.role, status: created.status },
      reason: audit.reason,
    }).catch(() => {});
  }

  return created;
}

export async function uploadAgentAvatar(agentId: string, file: File): Promise<string> {
  const supabase = createBrowserSupabaseClient();
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `agents/${agentId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${urlData.publicUrl}?t=${Date.now()}`;
}

export async function updateAgent(
  id: string,
  updates: Partial<Pick<Agent, 'name' | 'role' | 'description' | 'status' | 'defaultModel' | 'provider' | 'basePersonaVersion' | 'avatarUrl'>>,
  audit?: AuditContext,
): Promise<Agent> {
  const supabase = createBrowserSupabaseClient();

  const beforeAgent = await getAgentById(id);

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.defaultModel !== undefined) payload.default_model = updates.defaultModel;
  if (updates.provider !== undefined) payload.provider = updates.provider;
  if (updates.basePersonaVersion !== undefined) payload.base_persona_version = updates.basePersonaVersion;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

  const { data, error } = await supabase
    .from('agents')
    .update(payload as never)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const updated = rowToAgent(data as AgentRow);

  if (audit) {
    const actionType = updates.status !== undefined ? 'agent_status_changed' : 'agent_updated';
    await createAuditEntry({
      actorId: audit.actorId,
      actionType,
      entityType: 'Agent',
      entityId: id,
      beforeState: beforeAgent ? { status: beforeAgent.status, name: beforeAgent.name } : null,
      afterState: { status: updated.status, name: updated.name },
      reason: audit.reason,
    }).catch(() => {});
  }

  return updated;
}

export async function getAgentCount(): Promise<number> {
  const supabase = createBrowserSupabaseClient();
  const { count, error } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}
