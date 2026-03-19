/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authenticateClutchBearer } from '../_lib/auth';

function createSvc(): SupabaseClient<any> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// POST /api/clutch/docs
export async function POST(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const svc = createSvc();

  // Resolve or create folder path e.g. "Research/TestForge"
  let folderId: string | null = null;
  if (body.folderPath && typeof body.folderPath === 'string') {
    const parts: string[] = body.folderPath.split('/').map((p: string) => p.trim()).filter(Boolean);
    let parentId: string | null = null;

    for (const part of parts) {
      let q = svc.from('doc_folders').select('id').eq('name', part).limit(1);
      if (parentId === null) {
        q = q.is('parent_id', null);
      } else {
        q = q.eq('parent_id', parentId);
      }
      const { data: existing }: { data: Array<{ id: string }> | null } = await q;

      if (existing?.length) {
        parentId = existing[0].id;
      } else {
        const { data: created, error: folderErr }: { data: { id: string } | null; error: any } = await svc
          .from('doc_folders')
          .insert({ name: part, parent_id: parentId, project_tag: body.projectTag ?? null, created_by: user.id })
          .select('id')
          .single();
        if (folderErr || !created) {
          return NextResponse.json({ error: `Failed to create folder: ${part}` }, { status: 500 });
        }
        parentId = created.id;
      }
    }
    folderId = parentId;
  }

  const { data: doc, error: docErr }: { data: { id: string; title: string; folder_id: string | null; project_tag: string | null; created_at: string } | null; error: any } = await svc
    .from('docs')
    .insert({
      title: body.title,
      content: body.content ?? '',
      folder_id: folderId,
      project_tag: body.projectTag ?? null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id, title, folder_id, project_tag, created_at')
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: docErr?.message ?? 'Failed to create doc' }, { status: 500 });
  }

  return NextResponse.json({
    doc: {
      id: doc.id,
      title: doc.title,
      folderId: doc.folder_id,
      projectTag: doc.project_tag,
      createdAt: doc.created_at,
      url: `/docs?docId=${doc.id}`,
    },
  });
}
