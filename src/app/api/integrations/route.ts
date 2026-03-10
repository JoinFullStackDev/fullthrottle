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

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('integrations')
    .select(SAFE_COLUMNS)
    .order('type')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrations: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { type, agentId, config, credentials, status, reason } = body;

  if (!type || !reason) {
    return NextResponse.json({ error: 'type and reason are required' }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  const hasCredentials = credentials && Object.keys(credentials).length > 0;

  const resolvedStatus = status ?? (hasCredentials ? 'configured' : 'not_configured');

  const { data: row, error } = await svc
    .from('integrations')
    .insert({
      type,
      agent_id: agentId || null,
      status: resolvedStatus,
      config: config || {},
      created_by: user.id,
      updated_by: user.id,
    } as never)
    .select(SAFE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const created = row as IntegrationRow;

  if (hasCredentials) {
    const { error: credError } = await svc
      .from('integration_credentials')
      .insert({
        integration_id: created.id,
        credentials,
      } as never);

    if (credError) return NextResponse.json({ error: credError.message }, { status: 500 });
  }

  await createAuditEntry(svc, {
    actorId: user.id,
    actionType: 'integration_created',
    entityType: 'Integration',
    entityId: created.id,
    afterState: { type, agentId, status: created.status, configKeys: Object.keys(config || {}) },
    reason,
  });

  return NextResponse.json({ integration: safeResponse(created, hasCredentials) });
}
