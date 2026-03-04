import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';

export interface CreateAuditInput {
  actorId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  reason: string;
}

export async function createAuditEntry(
  client: SupabaseClient<Database>,
  input: CreateAuditInput,
): Promise<void> {
  await client
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
}
