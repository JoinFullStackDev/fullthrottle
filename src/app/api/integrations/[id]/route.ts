import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import { createAuditEntry } from '@/features/audit/service-server';

type ProfileRow = Tables<'profiles'>;
type IntegrationRow = Tables<'integrations'>;

const SAFE_COLUMNS = 'id, type, agent_id, status, config, created_by, updated_by, created_at, updated_at' as const;

function safeResponse(row: IntegrationRow, hasCredentials: boolean) {
  return { ...row, hasCredentials };
}

async function getAdminUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes((profile as ProfileRow).role)) return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { config, credentials, status, reason } = body;

  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const svc = createServiceRoleClient();

  const { data: beforeRow } = await svc.from('integrations').select(SAFE_COLUMNS).eq('id', id).single();
  if (!beforeRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const before = beforeRow as IntegrationRow;

  const hasNewCredentials = credentials && Object.keys(credentials).length > 0;

  const payload: Record<string, unknown> = { updated_by: user.id };
  if (config !== undefined) payload.config = config;
  if (status !== undefined) {
    payload.status = status;
  } else if (hasNewCredentials) {
    payload.status = 'configured';
  }

  const { data: updatedRow, error } = await svc
    .from('integrations')
    .update(payload as never)
    .eq('id', id)
    .select(SAFE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updated = updatedRow as IntegrationRow;

  if (hasNewCredentials) {
    const { data: existingCred } = await svc
      .from('integration_credentials')
      .select('id, credentials')
      .eq('integration_id', id)
      .single();

    if (existingCred) {
      const merged = {
        ...((existingCred.credentials as Record<string, unknown>) || {}),
        ...credentials,
      };
      await svc
        .from('integration_credentials')
        .update({ credentials: merged } as never)
        .eq('id', existingCred.id);
    } else {
      await svc
        .from('integration_credentials')
        .insert({ integration_id: id, credentials } as never);
    }
  }

  const { data: credRow } = await svc
    .from('integration_credentials')
    .select('credentials')
    .eq('integration_id', id)
    .single();

  const finalHasCreds = !!credRow && Object.keys((credRow.credentials as Record<string, unknown>) || {}).length > 0;

  await createAuditEntry(svc, {
    actorId: user.id,
    actionType: 'integration_updated',
    entityType: 'Integration',
    entityId: id,
    beforeState: { type: before.type, status: before.status, configKeys: Object.keys((before.config as Record<string, unknown>) || {}) },
    afterState: { type: updated.type, status: updated.status, configKeys: Object.keys((updated.config as Record<string, unknown>) || {}) },
    reason,
  });

  return NextResponse.json({ integration: safeResponse(updated, finalHasCreds) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reason = (body as Record<string, string>).reason || 'Integration removed';

  const svc = createServiceRoleClient();

  const { data: beforeRow } = await svc.from('integrations').select(SAFE_COLUMNS).eq('id', id).single();
  if (!beforeRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const beforeDel = beforeRow as IntegrationRow;

  const { error } = await svc.from('integrations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createAuditEntry(svc, {
    actorId: user.id,
    actionType: 'integration_deleted',
    entityType: 'Integration',
    entityId: id,
    beforeState: { type: beforeDel.type, agentId: beforeDel.agent_id, status: beforeDel.status },
    reason,
  });

  return NextResponse.json({ success: true });
}
