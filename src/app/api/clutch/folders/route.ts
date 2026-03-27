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

// GET /api/clutch/folders?projectTag=<tag>
export async function GET(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectTag = searchParams.get('projectTag');

  const svc = createSvc();
  let query = svc.from('doc_folders').select('*').order('name');
  if (projectTag) query = query.eq('project_tag', projectTag);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const folders = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    parentId: (row.parent_id as string | null) ?? null,
    projectTag: (row.project_tag as string | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return NextResponse.json({ folders });
}
