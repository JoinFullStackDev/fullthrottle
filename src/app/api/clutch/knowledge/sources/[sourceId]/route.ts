import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../../_lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sourceId } = await params;
  const svc = createServiceRoleClient();

  const { data: rawSource, error } = await svc
    .from('knowledge_sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (error || !rawSource) {
    return NextResponse.json(
      { error: 'Knowledge source not found' },
      { status: 404 },
    );
  }

  type KsRow = {
    id: string; name: string; path: string; external_id: string | null;
    mime_type: string | null; project_tag: string | null;
    created_at: string; last_modified_at: string | null; last_fetched_at: string | null;
  };
  const source = rawSource as KsRow;

  const { data: contentRows } = await svc
    .from('knowledge_content')
    .select('content, chunk_index, char_count')
    .eq('source_id', sourceId)
    .order('chunk_index', { ascending: true });

  const chunks = (contentRows ?? []) as Array<{
    content: string; chunk_index: number; char_count: number;
  }>;
  const fullContent = chunks.map((c) => c.content).join('\n');
  const totalChars = chunks.reduce((sum, c) => sum + c.char_count, 0);

  return NextResponse.json({
    source: {
      id: source.id,
      title: source.name,
      url: source.path,
      fileId: source.external_id,
      content: fullContent,
      mimeType: source.mime_type,
      charCount: totalChars,
      project: source.project_tag,
      createdAt: source.created_at,
      updatedAt: source.last_modified_at ?? source.last_fetched_at,
    },
  });
}
