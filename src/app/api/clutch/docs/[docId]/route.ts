/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authenticateClutchBearer } from '../../_lib/auth';

function createSvc(): SupabaseClient<any> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Walk parent chain to build "Grandparent/Parent/Folder" path, max depth 10 */
async function resolveFolderPath(folderId: string, svc: SupabaseClient<any>): Promise<string> {
  const parts: string[] = [];
  let currentId: string | null = folderId;
  let depth = 0;

  while (currentId && depth < 10) {
    const { data: row }: { data: Record<string, unknown> | null } = await svc
      .from('doc_folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .single();
    if (!row) break;
    parts.unshift(row.name as string);
    currentId = (row.parent_id as string | null) ?? null;
    depth++;
  }

  return parts.join('/');
}

function shapeDoc(row: Record<string, unknown>, folderPath: string) {
  return {
    id: row.id as string,
    title: row.title as string,
    content: (row.content as string) ?? '',
    folderId: (row.folder_id as string | null) ?? null,
    folderPath,
    projectTag: (row.project_tag as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    url: `/docs?docId=${row.id as string}`,
  };
}

// GET /api/clutch/docs/:docId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { docId } = await params;
  const svc = createSvc();

  const { data: doc, error } = await svc
    .from('docs')
    .select('*')
    .eq('id', docId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const row = doc as Record<string, unknown>;
  const folderId = (row.folder_id as string | null) ?? null;
  const folderPath = folderId ? await resolveFolderPath(folderId, svc) : '';

  return NextResponse.json({ doc: shapeDoc(row, folderPath) });
}

// PATCH /api/clutch/docs/:docId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { docId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const svc = createSvc();

  const { data: existing, error: fetchErr } = await svc
    .from('docs')
    .select('*')
    .eq('id', docId)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const existingRow = existing as Record<string, unknown>;

  // Validate target folder belongs to same project
  if ('folderId' in body && body.folderId !== null && body.folderId !== undefined) {
    const { data: folder } = await svc
      .from('doc_folders')
      .select('id, project_tag')
      .eq('id', body.folderId)
      .single();

    if (!folder) {
      return NextResponse.json({ error: 'Target folder not found' }, { status: 400 });
    }

    const folderRow = folder as Record<string, unknown>;
    const docProjectTag = (existingRow.project_tag as string | null) ?? null;
    const folderProjectTag = (folderRow.project_tag as string | null) ?? null;

    if (
      docProjectTag !== null &&
      folderProjectTag !== null &&
      docProjectTag !== folderProjectTag
    ) {
      return NextResponse.json(
        { error: 'Folder belongs to a different project' },
        { status: 400 },
      );
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };
  if (body.title !== undefined) updates.title = String(body.title);
  if (body.content !== undefined) updates.content = String(body.content);
  if ('folderId' in body) updates.folder_id = body.folderId ?? null;

  const { data: updated, error: updateErr } = await svc
    .from('docs')
    .update(updates)
    .eq('id', docId)
    .select('*')
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? 'Failed to update doc' },
      { status: 500 },
    );
  }

  const updatedRow = updated as Record<string, unknown>;
  const newFolderId = (updatedRow.folder_id as string | null) ?? null;
  const folderPath = newFolderId ? await resolveFolderPath(newFolderId, svc) : '';

  return NextResponse.json({ doc: shapeDoc(updatedRow, folderPath) });
}
