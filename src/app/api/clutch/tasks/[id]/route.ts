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

const VALID_STATUSES = new Set(['backlog', 'ready', 'in_progress', 'waiting', 'review', 'done']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const AGENT_SLUG_TO_ID: Record<string, string> = {
  axel: 'a0000000-0000-0000-0000-000000000001',
  riff: 'a0000000-0000-0000-0000-000000000002',
  torque: 'a0000000-0000-0000-0000-000000000003',
  clutch: 'a0000000-0000-0000-0000-000000000004',
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const svc = createServiceRoleClient();

  // Verify task exists
  const { data: existing, error: fetchErr } = await svc
    .from('tasks')
    .select('id, metadata')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid values: ${[...VALID_STATUSES].join(', ')}` },
        { status: 400 },
      );
    }
    updates.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.has(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Valid values: ${[...VALID_PRIORITIES].join(', ')}` },
        { status: 400 },
      );
    }
    updates.priority = body.priority;
  }

  if (body.title !== undefined) updates.title = String(body.title);
  if (body.description !== undefined) updates.description = String(body.description);

  // Support agent slug assignment (e.g. assignedAgent: "axel")
  if (body.assignedAgent !== undefined) {
    const agentId = AGENT_SLUG_TO_ID[body.assignedAgent.toLowerCase()] ?? body.assignedAgent;
    updates.owner_id = agentId;
    updates.owner_type = 'agent';
  }

  // Support metadata merge (e.g. store agent output)
  if (body.metadata !== undefined && typeof body.metadata === 'object') {
    const existingRow = existing as unknown as Record<string, unknown>;
    const existingMeta = (existingRow.metadata ?? {}) as Record<string, unknown>;
    updates.metadata = { ...existingMeta, ...body.metadata };
  }

  const { data: updated, error: updateErr } = await svc
    .from('tasks')
    .update(updates as never)
    .eq('id', id)
    .select('id, title, status, priority, owner_id, owner_type, updated_at')
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? 'Failed to update task' },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: updated });
}
