import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

async function authenticateBearerToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await authenticateBearerToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const parentId = searchParams.get('parentId');
  const ownerId = searchParams.get('ownerId');
  const since = searchParams.get('since');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 200);

  const svc = createServiceRoleClient();
  let query = svc
    .from('tasks')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status as 'backlog' | 'ready' | 'in_progress' | 'waiting' | 'review' | 'done');
  if (parentId) query = query.eq('parent_task_id' as string, parentId);
  if (ownerId) query = query.eq('owner_id', ownerId);
  if (since) query = query.gte('updated_at', since);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tasks = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    priority: row.priority,
    projectTag: row.project_tag,
    runtimeRunId: row.runtime_run_id ?? null,
    lastRuntimeStatus: row.last_runtime_status ?? null,
    metadata: row.metadata ?? {},
    parentTaskId: row.parent_task_id ?? null,
    externalRef: row.external_ref ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ tasks });
}
