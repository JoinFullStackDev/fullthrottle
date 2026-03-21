import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';
import type { TaskStatusValue } from '@/lib/constants';
import { createAuditEntry } from '@/features/audit/service';

type TaskRow = Tables<'tasks'>;

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    priority: row.priority,
    projectTag: row.project_tag,
    runtimeRunId: row.runtime_run_id,
    lastRuntimeStatus: row.last_runtime_status,
    metadata: ((row as Record<string, unknown>).metadata ?? {}) as Record<string, unknown>,
    parentTaskId: ((row as Record<string, unknown>).parent_task_id as string) ?? null,
    externalRef: ((row as Record<string, unknown>).external_ref as string) ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasks(): Promise<Task[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as TaskRow[]).map(rowToTask);
}

export async function listTasksByOwner(ownerId: string): Promise<Task[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as TaskRow[]).map(rowToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return rowToTask(data as TaskRow);
}

export interface CreateTaskInput {
  title: string;
  description: string;
  ownerType: 'human' | 'agent';
  ownerId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectTag: string;
  createdBy: string;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description,
      owner_type: input.ownerType,
      owner_id: input.ownerId,
      priority: input.priority,
      project_tag: input.projectTag,
      created_by: input.createdBy,
    } as never)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const task = rowToTask(data as TaskRow);

  await createAuditEntry({
    actorId: input.createdBy,
    actionType: 'task_created',
    entityType: 'Task',
    entityId: task.id,
    afterState: { title: task.title, status: task.status, ownerId: task.ownerId },
    reason: `Task "${task.title}" created`,
  }).catch(() => {});

  return task;
}

export async function updateTaskStatus(id: string, status: TaskStatusValue): Promise<Task> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .update({ status } as never)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToTask(data as TaskRow);
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'projectTag' | 'ownerType' | 'ownerId'>>,
): Promise<Task> {
  const supabase = createBrowserSupabaseClient();
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.projectTag !== undefined) payload.project_tag = updates.projectTag;
  if (updates.ownerType !== undefined) payload.owner_type = updates.ownerType;
  if (updates.ownerId !== undefined) payload.owner_id = updates.ownerId;

  const { data, error } = await supabase
    .from('tasks')
    .update(payload as never)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToTask(data as TaskRow);
}

export async function listTasksByParent(parentId: string): Promise<Task[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_task_id' as string, parentId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as TaskRow[]).map(rowToTask);
}

export async function reengageTask(id: string, context?: string): Promise<Task> {
  const res = await fetch(`/api/clutch/tasks/${id}/reengage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to re-engage task' }));
    throw new Error(err.error ?? 'Failed to re-engage task');
  }
  const json = await res.json();
  // Refresh the full task from supabase to get all fields
  const refreshed = await getTaskById(id);
  return refreshed ?? (json.task as Task);
}

export async function assignTaskAgent(id: string, agentSlug: string): Promise<void> {
  const res = await fetch(`/api/clutch/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignedAgent: agentSlug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to assign agent' }));
    throw new Error(err.error ?? 'Failed to assign agent');
  }
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getTaskCounts(): Promise<{ total: number; active: number; review: number }> {
  const supabase = createBrowserSupabaseClient();

  const { count: total, error: e1 } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const { count: active, error: e2 } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_progress', 'ready']);

  const { count: review, error: e3 } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'review');

  if (e1 || e2 || e3) throw new Error((e1 || e2 || e3)!.message);
  return { total: total ?? 0, active: active ?? 0, review: review ?? 0 };
}
