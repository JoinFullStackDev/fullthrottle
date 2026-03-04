import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { PersonaOverride, PersonaRule, PersonaSkill, KnowledgeScopeConfig, EscalationConfig } from '@/lib/types';
import type { Tables, Json } from '@/lib/supabase/database.types';
import { createAuditEntry } from '@/features/audit/service';

interface AuditContext {
  actorId: string;
  reason: string;
}

type OverrideRow = Tables<'persona_overrides'>;

function rowToOverride(row: OverrideRow): PersonaOverride {
  return {
    id: row.id,
    agentId: row.agent_id,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    rules: (row.rules ?? []) as unknown as PersonaRule[],
    skills: (row.skills ?? []) as unknown as PersonaSkill[],
    templates: (row.templates ?? {}) as Record<string, string>,
    knowledgeScope: (row.knowledge_scope ?? {}) as unknown as KnowledgeScopeConfig,
    escalationRules: (row.escalation_rules ?? {}) as unknown as EscalationConfig,
    riskTolerance: row.risk_tolerance,
    version: row.version,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
  };
}

export async function listOverrides(agentId: string): Promise<PersonaOverride[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('persona_overrides')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as OverrideRow[]).map(rowToOverride);
}

export async function getOverride(id: string): Promise<PersonaOverride | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('persona_overrides')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return rowToOverride(data as OverrideRow);
}

export async function createOverride(
  override: Omit<PersonaOverride, 'id' | 'createdAt'>,
  audit?: AuditContext,
): Promise<PersonaOverride> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('persona_overrides')
    .insert({
      agent_id: override.agentId,
      scope_type: override.scopeType,
      scope_id: override.scopeId,
      rules: override.rules as unknown as Json,
      skills: override.skills as unknown as Json,
      templates: override.templates as unknown as Json,
      knowledge_scope: override.knowledgeScope as unknown as Json,
      escalation_rules: override.escalationRules as unknown as Json,
      risk_tolerance: override.riskTolerance,
      version: override.version,
      created_by: override.createdBy,
      approved_by: override.approvedBy,
    } as never)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const created = rowToOverride(data as OverrideRow);

  if (audit) {
    await createAuditEntry({
      actorId: audit.actorId,
      actionType: 'persona_override_created',
      entityType: 'PersonaOverride',
      entityId: created.id,
      afterState: { scopeType: created.scopeType, version: created.version, agentId: created.agentId },
      reason: audit.reason,
    }).catch(() => {});
  }

  return created;
}

export async function updateOverride(
  id: string,
  updates: Partial<PersonaOverride>,
  audit?: AuditContext,
): Promise<PersonaOverride> {
  const supabase = createBrowserSupabaseClient();

  const beforeOverride = audit ? await getOverride(id) : null;

  const payload: Record<string, unknown> = {};
  if (updates.rules !== undefined) payload.rules = updates.rules;
  if (updates.skills !== undefined) payload.skills = updates.skills;
  if (updates.templates !== undefined) payload.templates = updates.templates;
  if (updates.knowledgeScope !== undefined) payload.knowledge_scope = updates.knowledgeScope;
  if (updates.escalationRules !== undefined) payload.escalation_rules = updates.escalationRules;
  if (updates.riskTolerance !== undefined) payload.risk_tolerance = updates.riskTolerance;
  if (updates.version !== undefined) payload.version = updates.version;
  if (updates.approvedBy !== undefined) payload.approved_by = updates.approvedBy;

  const { data, error } = await supabase
    .from('persona_overrides')
    .update(payload as never)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const updated = rowToOverride(data as OverrideRow);

  if (audit) {
    await createAuditEntry({
      actorId: audit.actorId,
      actionType: 'persona_override_updated',
      entityType: 'PersonaOverride',
      entityId: id,
      beforeState: beforeOverride
        ? { version: beforeOverride.version, riskTolerance: beforeOverride.riskTolerance, rulesCount: beforeOverride.rules.length }
        : null,
      afterState: { version: updated.version, riskTolerance: updated.riskTolerance, rulesCount: updated.rules.length },
      reason: audit.reason,
    }).catch(() => {});
  }

  return updated;
}
