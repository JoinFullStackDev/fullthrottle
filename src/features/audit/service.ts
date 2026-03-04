import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { AuditLogEntry } from '@/lib/types';
import type { Tables, Json } from '@/lib/supabase/database.types';

type AuditRow = Tables<'audit_logs'>;

function rowToAuditEntry(row: AuditRow, actorName?: string): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: actorName,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeState: row.before_state as Record<string, unknown> | null,
    afterState: row.after_state as Record<string, unknown> | null,
    reason: row.reason,
    timestamp: row.timestamp,
  };
}

export interface AuditFilters {
  entityType?: string;
  actionType?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}

export async function listAuditLogs(filters: AuditFilters = {}): Promise<AuditLogEntry[]> {
  const supabase = createBrowserSupabaseClient();
  let query = supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_actor_id_fkey(name)')
    .order('timestamp', { ascending: false });

  if (filters.entityType) query = query.eq('entity_type', filters.entityType);
  if (filters.actionType) query = query.eq('action_type', filters.actionType);
  if (filters.actorId) query = query.eq('actor_id', filters.actorId);
  query = query.range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as (AuditRow & { profiles: { name: string } | null })[]).map((row) =>
    rowToAuditEntry(row, row.profiles?.name ?? 'Unknown'),
  );
}

export interface CreateAuditInput {
  actorId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  reason: string;
}

export async function createAuditEntry(input: CreateAuditInput): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      actor_id: input.actorId,
      action_type: input.actionType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      before_state: (input.beforeState ?? null) as Json,
      after_state: (input.afterState ?? null) as Json,
      reason: input.reason,
    } as never);

  if (error) throw new Error(error.message);
}
