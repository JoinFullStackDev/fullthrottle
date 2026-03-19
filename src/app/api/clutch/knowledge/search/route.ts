import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../_lib/auth';
import { findRelevantKnowledgeSources, extractSourceIds } from '@/lib/knowledge/auto-enrich';

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
  const projectTag = (projects?.[0] ?? body.projectTag ?? '') as string;
  const limit = Math.min(
    parseInt(body.limit ?? '10', 10) || 10,
    50,
  );

  // Use the unified multi-source search: knowledge base + docs/ + agent personas
  const matches = await findRelevantKnowledgeSources(searchQuery, projectTag, limit);

  // For backwards compatibility, also run the legacy exact-match query against the DB
  // so that sources not caught by keyword extraction still surface.
  const svc = createServiceRoleClient();
  const { data: contentRows } = await svc
    .from('knowledge_content')
    .select('id, source_id, content, char_count')
    .ilike('content', `%${searchQuery}%`)
    .limit(limit * 3);

  const legacySourceIds = new Set(extractSourceIds(matches));
  const seenSources = new Set<string>(legacySourceIds);
  const extraSourceIds: string[] = [];

  for (const row of contentRows ?? []) {
    if (!seenSources.has(row.source_id)) {
      seenSources.add(row.source_id);
      extraSourceIds.push(row.source_id);
    }
  }

  let extraResults: typeof matches = [];
  if (extraSourceIds.length > 0) {
    let sourceQuery = svc
      .from('knowledge_sources')
      .select('id, name, path, mime_type, project_tag, external_id')
      .in('id', extraSourceIds);

    if (projects?.length) {
      sourceQuery = sourceQuery.in('project_tag', projects);
    }

    const { data: sourceRows } = await sourceQuery;
    const contentMap = new Map(
      (contentRows ?? []).map((r) => [r.source_id, r]),
    );

    for (const s of sourceRows ?? []) {
      const contentRow = contentMap.get(s.id);
      if (!contentRow) continue;

      const lowerContent = contentRow.content.toLowerCase();
      const matchIdx = lowerContent.indexOf(searchQuery.toLowerCase());
      const excerptStart = Math.max(0, matchIdx - 100);
      const excerptEnd = Math.min(
        contentRow.content.length,
        matchIdx + searchQuery.length + 100,
      );
      const excerpt =
        (excerptStart > 0 ? '...' : '') +
        contentRow.content.slice(excerptStart, excerptEnd) +
        (excerptEnd < contentRow.content.length ? '...' : '');

      extraResults.push({
        sourceId: s.id,
        title: s.name,
        excerpt,
        project: s.project_tag,
        source: 'knowledge_base',
      });
    }
  }

  // Merge: multi-source matches first (ranked), then any extra DB-only hits
  const allResults = [...matches, ...extraResults].slice(0, limit);

  const results = allResults.map((m) => ({
    sourceId: m.sourceId ?? null,
    title: m.title,
    excerpt: m.excerpt,
    relevance: 1.0,
    project: m.project,
    sourceType: m.source,
  }));

  return NextResponse.json({ results });
}
