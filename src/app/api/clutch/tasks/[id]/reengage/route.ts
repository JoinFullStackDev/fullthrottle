import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../../_lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const context = typeof body?.context === 'string' ? body.context : null;

  const svc = createServiceRoleClient();

  const { data: existing, error: fetchErr } = await svc
    .from('tasks')
    .select('id, status, owner_type, owner_id')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const row = existing as Record<string, unknown>;

  if (row.owner_type !== 'agent') {
    return NextResponse.json({ error: 'Task is not assigned to an agent' }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await svc
    .from('tasks')
    .update({
      status: 'in_progress',
      runtime_run_id: null,
      last_runtime_status: context
        ? `Re-engaged by user: ${context}`
        : 'Re-engaged by user',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select('id, title, status, priority, owner_id, owner_type, runtime_run_id, last_runtime_status, updated_at')
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? 'Failed to re-engage task' },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: updated });
}
