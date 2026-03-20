import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../../_lib/auth';

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

  // Use untyped client — doc_folders is outside the generated schema types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceRoleClient() as any;

  // Guard against circular nesting server-side
  if (body.parentId !== undefined && body.parentId !== null) {
    const { data: allFolders } = await svc.from('doc_folders').select('id, parent_id');
    const parentMap = new Map<string, string | null>(
      (allFolders ?? []).map((f: Record<string, unknown>) => [
        f.id as string,
        (f.parent_id as string | null) ?? null,
      ]),
    );
    let cursor: string | null = body.parentId as string;
    while (cursor !== null) {
      if (cursor === id) {
        return NextResponse.json(
          { error: 'Circular nesting: cannot move a folder into its own descendant.' },
          { status: 400 },
        );
      }
      cursor = parentMap.get(cursor) ?? null;
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('parentId' in body) updates.parent_id = body.parentId ?? null;
  if (body.name !== undefined) updates.name = String(body.name);

  const { data, error } = await svc.from('doc_folders').update(updates).eq('id', id).select().single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update folder' }, { status: 500 });
  }

  const row = data as Record<string, unknown>;
  const folder = {
    id: row.id,
    name: row.name,
    parentId: row.parent_id ?? null,
    projectTag: row.project_tag ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return NextResponse.json({ folder });
}
