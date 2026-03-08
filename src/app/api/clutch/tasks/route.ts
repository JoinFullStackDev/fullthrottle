import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer, AGENT_SLUG_TO_ID } from '../_lib/auth';

export async function GET(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  const project = searchParams.get('project');
  const priority = searchParams.get('priority');
  const search = searchParams.get('search');
  const limit = Math.min(
    parseInt(searchParams.get('limit') ?? '20', 10) || 20,
    100,
  );

  const svc = createServiceRoleClient();

  // Pre-fetch agents for name resolution (owner_id is text, no FK)
  const { data: agentRows } = await svc.from('agents').select('id, name');
  const agentMap = new Map(
    (agentRows ?? []).map((a) => [a.id, a.name]),
  );

  let query = svc
    .from('tasks')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status) {
    const values = status.split(',').map((s) => s.trim()) as Array<
      'backlog' | 'ready' | 'in_progress' | 'waiting' | 'review' | 'done'
    >;
    query = query.in('status', values);
  }

  if (assignee) {
    const agentId = AGENT_SLUG_TO_ID[assignee.toLowerCase()] ?? assignee;
    query = query.eq('owner_id', agentId);
  }

  if (project) {
    query = query.eq('project_tag', project);
  }

  if (priority) {
    const values = priority.split(',').map((p) => p.trim()) as Array<
      'low' | 'medium' | 'high' | 'critical'
    >;
    query = query.in('priority', values);
  }

  if (search) {
    const escaped = search.replace(/%/g, '\\%');
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tasks = (data ?? []).map((row: Record<string, unknown>) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const ownerId = row.owner_id as string;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      projectTag: row.project_tag,
      assignedTo: agentMap.has(ownerId)
        ? { agentId: ownerId, name: agentMap.get(ownerId) }
        : null,
      suggestedAgent: meta.suggestedAgent ?? null,
      acceptanceCriteria: meta.acceptanceCriteria ?? null,
      sourceCitations: (meta.sourceCitations as string[]) ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      parentTaskId: row.parent_task_id ?? null,
      knowledgeSourceIds: (meta.knowledgeSourceIds as string[]) ?? [],
    };
  });

  return NextResponse.json({ tasks, total: count ?? tasks.length });
}
