import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createAuditEntry } from '@/features/audit/service-server';
import type { Database, Json } from '@/lib/supabase/database.types';

const CLUTCH_AGENT_ID = 'a0000000-0000-0000-0000-000000000004';

const AGENT_NAME_TO_ID: Record<string, string> = {
  axel: 'a0000000-0000-0000-0000-000000000001',
  riff: 'a0000000-0000-0000-0000-000000000002',
  torque: 'a0000000-0000-0000-0000-000000000003',
};

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

interface IntakeSource {
  type: string;
  [key: string]: unknown;
}

interface IntakePayload {
  externalRef: string;
  intake: {
    title: string;
    rawRequest: string;
    requestedOutcome: string;
    source: IntakeSource;
    attachments?: string[];
    projectTag?: string;
  };
  tasks: Array<{
    title: string;
    description: string;
    acceptanceCriteria?: string;
    suggestedAgent?: string | null;
    priority?: string;
    sourceCitations?: string[];
    projectTag?: string;
  }>;
}

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

export async function POST(req: NextRequest) {
  const user = await authenticateBearerToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: IntakePayload = await req.json().catch(() => null);
  if (!body?.externalRef || !body?.intake?.title || !body?.intake?.source?.type) {
    return NextResponse.json(
      { error: 'externalRef, intake.title, and intake.source.type are required' },
      { status: 400 },
    );
  }

  const svc = createServiceRoleClient();

  // Idempotency check
  const { data: existing } = await svc
    .from('tasks')
    .select('id')
    .eq('external_ref' as string, body.externalRef)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Duplicate intake', existingTaskId: (existing[0] as { id: string }).id },
      { status: 409 },
    );
  }

  const projectTag = body.intake.projectTag ?? '';

  // Build parent task metadata
  const parentMetadata: Record<string, unknown> = {
    source: body.intake.source,
    rawRequest: body.intake.rawRequest,
    requestedOutcome: body.intake.requestedOutcome,
    attachments: body.intake.attachments ?? [],
    intakeType: 'parent',
  };

  // Insert parent task
  const { data: parentRow, error: parentErr } = await svc
    .from('tasks')
    .insert({
      title: body.intake.title,
      description: body.intake.requestedOutcome || body.intake.rawRequest,
      status: 'backlog',
      owner_type: 'agent',
      owner_id: CLUTCH_AGENT_ID,
      priority: 'medium',
      project_tag: projectTag,
      created_by: user.id,
      metadata: parentMetadata as Json,
      external_ref: body.externalRef,
    } as never)
    .select('id')
    .single();

  if (parentErr || !parentRow) {
    return NextResponse.json(
      { error: parentErr?.message ?? 'Failed to create intake task' },
      { status: 500 },
    );
  }

  const parentId = (parentRow as { id: string }).id;

  // Build derived task rows for batch insert
  const derivedRows = (body.tasks ?? []).map((t) => {
    const priority = VALID_PRIORITIES.has(t.priority ?? '') ? t.priority! : 'medium';
    const childMeta: Record<string, unknown> = { intakeType: 'derived' };
    if (t.suggestedAgent) childMeta.suggestedAgent = t.suggestedAgent;
    if (t.acceptanceCriteria) childMeta.acceptanceCriteria = t.acceptanceCriteria;
    if (t.sourceCitations?.length) childMeta.sourceCitations = t.sourceCitations;

    return {
      title: t.title,
      description: t.description,
      status: 'backlog' as const,
      owner_type: 'human' as const,
      owner_id: '',
      priority,
      project_tag: t.projectTag ?? projectTag,
      created_by: user.id,
      parent_task_id: parentId,
      metadata: childMeta as Json,
    };
  });

  const derivedIds: string[] = [];

  if (derivedRows.length > 0) {
    const { data: derivedData, error: derivedErr } = await svc
      .from('tasks')
      .insert(derivedRows as never[])
      .select('id');

    if (derivedErr) {
      return NextResponse.json(
        { error: `Intake created but derived tasks failed: ${derivedErr.message}`, intakeTaskId: parentId },
        { status: 500 },
      );
    }

    for (const row of (derivedData ?? []) as { id: string }[]) {
      derivedIds.push(row.id);
    }
  }

  // Batch audit entries
  const auditRows = [
    {
      actorId: user.id,
      actionType: 'intake_created',
      entityType: 'Task',
      entityId: parentId,
      afterState: {
        title: body.intake.title,
        sourceType: body.intake.source.type,
        externalRef: body.externalRef,
        derivedCount: derivedIds.length,
      },
      reason: `Clutch intake from ${body.intake.source.type}: "${body.intake.title}"`,
    },
    ...derivedRows.map((r, i) => ({
      actorId: user.id,
      actionType: 'task_created',
      entityType: 'Task',
      entityId: derivedIds[i] ?? parentId,
      afterState: {
        title: r.title,
        parentTaskId: parentId,
        suggestedAgent: (r.metadata as Record<string, unknown>).suggestedAgent ?? null,
      },
      reason: `Derived task from intake "${body.intake.title}"`,
    })),
  ];

  for (const entry of auditRows) {
    await createAuditEntry(svc, entry).catch(() => {});
  }

  return NextResponse.json({
    intakeTaskId: parentId,
    derivedTaskIds: derivedIds,
    totalCreated: 1 + derivedIds.length,
  });
}
