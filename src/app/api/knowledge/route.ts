import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import { createAuditEntry } from '@/features/audit/service-server';

type ProfileRow = Tables<'profiles'>;

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
    .from('knowledge_sources')
    .select('*, agents(name)')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const {
    name, type, path, sourceType, externalId, integrationId,
    agentId, folderTag, projectTag, refreshIntervalMinutes, mimeType, reason,
  } = body;

  if (!name || !reason) {
    return NextResponse.json({ error: 'name and reason are required' }, { status: 400 });
  }

  const svc = createServiceRoleClient();

  const { data: row, error } = await svc
    .from('knowledge_sources')
    .insert({
      name,
      type: type || sourceType || 'Document',
      path: path || externalId || '',
      source_type: sourceType || 'manual',
      external_id: externalId || null,
      integration_id: integrationId || null,
      agent_id: agentId || null,
      folder_tag: folderTag || null,
      project_tag: projectTag || null,
      refresh_interval_minutes: refreshIntervalMinutes ?? 60,
      mime_type: mimeType || null,
    } as never)
    .select('*, agents(name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createAuditEntry(svc, {
    actorId: user.id,
    actionType: 'knowledge_source_created',
    entityType: 'KnowledgeSource',
    entityId: (row as { id: string }).id,
    afterState: { name, sourceType, folderTag, projectTag, agentId },
    reason,
  });

  // Auto-update agent's persona override knowledge scope
  if (agentId && (projectTag || folderTag)) {
    const { data: overrides } = await svc
      .from('persona_overrides')
      .select('id, knowledge_scope')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (overrides?.length) {
      const override = overrides[0];
      const scope = (override.knowledge_scope ?? {}) as Record<string, unknown>;
      const currentFolders = (scope.allowedFolders as string[]) ?? [];
      const currentProjects = (scope.allowedProjects as string[]) ?? [];
      let changed = false;

      if (folderTag && !currentFolders.includes(folderTag)) {
        currentFolders.push(folderTag);
        changed = true;
      }
      if (projectTag && !currentProjects.includes(projectTag)) {
        currentProjects.push(projectTag);
        changed = true;
      }

      if (changed) {
        await svc
          .from('persona_overrides')
          .update({
            knowledge_scope: { ...scope, allowedFolders: currentFolders, allowedProjects: currentProjects },
          } as never)
          .eq('id', override.id);
      }
    }
  }

  return NextResponse.json({ source: row });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const reason = searchParams.get('reason') ?? 'Knowledge source deleted';

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const svc = createServiceRoleClient();

  const { error } = await svc
    .from('knowledge_sources')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createAuditEntry(svc, {
    actorId: user.id,
    actionType: 'knowledge_source_deleted',
    entityType: 'KnowledgeSource',
    entityId: id,
    reason,
  });

  return NextResponse.json({ ok: true });
}
