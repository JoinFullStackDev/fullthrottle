import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../_lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const svc = createServiceRoleClient();

  const { data: agentRows } = await svc.from('agents').select('id, name');
  const agentMap = new Map(
    (agentRows ?? []).map((a) => [a.id, a.name]),
  );

  const { data: rawRow, error } = await svc
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !rawRow) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const row = rawRow as Record<string, unknown>;
  const meta = (row.metadata ?? {}) as Record<string, unknown>;

  const task = {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    projectTag: row.project_tag,
    assignedTo: agentMap.has(row.owner_id as string)
      ? { agentId: row.owner_id, name: agentMap.get(row.owner_id as string) }
      : null,
    suggestedAgent: meta.suggestedAgent ?? null,
    acceptanceCriteria: meta.acceptanceCriteria ?? null,
    sourceCitations: (meta.sourceCitations as string[]) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentTaskId: row.parent_task_id ?? null,
    knowledgeSourceIds: (meta.knowledgeSourceIds as string[]) ?? [],
    metadata: meta,
  };

  let relatedTasks: { id: string; title: string; status: string }[] = [];
  if (row.parent_task_id) {
    const { data: siblings } = await svc
      .from('tasks')
      .select('id, title, status')
      .eq('parent_task_id' as string, row.parent_task_id as string)
      .neq('id', id)
      .order('created_at', { ascending: true })
      .limit(20);

    relatedTasks = (siblings ?? []) as typeof relatedTasks;
  }

  return NextResponse.json({ task, relatedTasks });
}
