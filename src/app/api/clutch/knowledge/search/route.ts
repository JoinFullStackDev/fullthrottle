import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../_lib/auth';

export async function POST(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.query || typeof body.query !== 'string' || !body.query.trim()) {
    return NextResponse.json(
      { error: 'query is required' },
      { status: 400 },
    );
  }

  const searchQuery = body.query.trim();
  const projects: string[] | undefined = body.projects;
  const limit = Math.min(
    parseInt(body.limit ?? '10', 10) || 10,
    50,
  );

  const svc = createServiceRoleClient();

  // Search content chunks matching the query
  const { data: contentRows, error: contentErr } = await svc
    .from('knowledge_content')
    .select('id, source_id, content, char_count')
    .ilike('content', `%${searchQuery}%`)
    .limit(limit * 3); // fetch extra to allow per-source dedup

  if (contentErr) {
    return NextResponse.json({ error: contentErr.message }, { status: 500 });
  }

  if (!contentRows?.length) {
    return NextResponse.json({ results: [] });
  }

  // Deduplicate: keep first matching chunk per source
  const seenSources = new Set<string>();
  const dedupedRows: typeof contentRows = [];
  for (const row of contentRows) {
    if (seenSources.has(row.source_id)) continue;
    seenSources.add(row.source_id);
    dedupedRows.push(row);
  }

  const sourceIds = dedupedRows.map((r) => r.source_id);

  // Fetch matching knowledge sources
  let sourceQuery = svc
    .from('knowledge_sources')
    .select('id, name, path, mime_type, project_tag, external_id')
    .in('id', sourceIds);

  if (projects?.length) {
    sourceQuery = sourceQuery.in('project_tag', projects);
  }

  const { data: sourceRows, error: sourceErr } = await sourceQuery;

  if (sourceErr) {
    return NextResponse.json({ error: sourceErr.message }, { status: 500 });
  }

  const sourceMap = new Map(
    (sourceRows ?? []).map((s) => [s.id, s]),
  );

  // Build results, limited and filtered by source availability
  const results: Array<{
    sourceId: string;
    title: string;
    url: string;
    mimeType: string | null;
    excerpt: string;
    relevance: number;
    project: string | null;
  }> = [];

  for (const row of dedupedRows) {
    if (results.length >= limit) break;

    const source = sourceMap.get(row.source_id);
    if (!source) continue;

    const lowerContent = row.content.toLowerCase();
    const matchIdx = lowerContent.indexOf(searchQuery.toLowerCase());
    const excerptStart = Math.max(0, matchIdx - 100);
    const excerptEnd = Math.min(
      row.content.length,
      matchIdx + searchQuery.length + 100,
    );
    const excerpt =
      (excerptStart > 0 ? '...' : '') +
      row.content.slice(excerptStart, excerptEnd) +
      (excerptEnd < row.content.length ? '...' : '');

    results.push({
      sourceId: source.id,
      title: source.name,
      url: source.path,
      mimeType: source.mime_type,
      excerpt,
      relevance: 1.0,
      project: source.project_tag,
    });
  }

  return NextResponse.json({ results });
}
