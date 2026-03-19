/**
 * Knowledge auto-enrichment for Clutch intake.
 *
 * When Clutch receives a Slack request and builds an intake payload, it should
 * call `enrichIntakeWithKnowledge` before submitting to POST /api/clutch/intake.
 * This searches the indexed knowledge base for documents relevant to the request
 * text and project, then attaches their source IDs to the intake and task payloads
 * so that Riff/Axel/Torque receive proper grounding context.
 *
 * The search is intentionally lightweight (keyword-based, same engine as the
 * /api/clutch/knowledge/search endpoint). If no results are found, the intake
 * proceeds unchanged — enrichment is best-effort.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface KnowledgeMatch {
  sourceId: string;
  title: string;
  excerpt: string;
  project: string | null;
}

/**
 * Search indexed knowledge content for sources relevant to a request.
 *
 * Searches using keyword extraction from the request text (top N significant
 * words) filtered by the project tag. Returns up to `limit` unique sources.
 */
export async function findRelevantKnowledgeSources(
  requestText: string,
  projectTag: string,
  limit = 5,
): Promise<KnowledgeMatch[]> {
  const svc = createServiceRoleClient();

  // Extract meaningful search terms: strip common stopwords, take longest words
  // first (tend to be more domain-specific and useful for matching).
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'if', 'when', 'what', 'how', 'why',
    'which', 'who', 'they', 'their', 'there', 'then', 'than', 'not', 'no',
    'any', 'all', 'also', 'so', 'just', 'we', 'i', 'you', 'he', 'she',
  ]);

  const words = requestText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.has(w));

  // Deduplicate and take the top 5 longest (most specific) terms
  const uniqueWords = [...new Set(words)];
  const searchTerms = uniqueWords
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  if (searchTerms.length === 0) return [];

  // Run one search per term, collect source IDs, deduplicate across terms.
  // We fan out in parallel but keep the total result set small.
  const sourceIdHits = new Map<string, { count: number; firstExcerpt: string; contentId: string }>();

  await Promise.all(
    searchTerms.map(async (term) => {
      const { data: contentRows } = await svc
        .from('knowledge_content')
        .select('id, source_id, content')
        .ilike('content', `%${term}%`)
        .limit(10);

      for (const row of contentRows ?? []) {
        const existing = sourceIdHits.get(row.source_id);
        const lowerContent = row.content.toLowerCase();
        const matchIdx = lowerContent.indexOf(term);
        const excerptStart = Math.max(0, matchIdx - 80);
        const excerptEnd = Math.min(row.content.length, matchIdx + term.length + 80);
        const excerpt =
          (excerptStart > 0 ? '...' : '') +
          row.content.slice(excerptStart, excerptEnd) +
          (excerptEnd < row.content.length ? '...' : '');

        if (existing) {
          existing.count += 1;
        } else {
          sourceIdHits.set(row.source_id, { count: 1, firstExcerpt: excerpt, contentId: row.id });
        }
      }
    }),
  );

  if (sourceIdHits.size === 0) return [];

  // Sort by hit count descending (more term matches = more relevant)
  const rankedSourceIds = [...sourceIdHits.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id]) => id);

  // Fetch source metadata, filtered to the project tag
  const { data: sourceRows } = await svc
    .from('knowledge_sources')
    .select('id, name, project_tag')
    .in('id', rankedSourceIds)
    .eq('project_tag', projectTag)
    .limit(limit);

  if (!sourceRows?.length) {
    // Fallback: include sources without a project tag (untagged = global knowledge)
    const { data: globalRows } = await svc
      .from('knowledge_sources')
      .select('id, name, project_tag')
      .in('id', rankedSourceIds)
      .is('project_tag', null)
      .limit(limit);

    if (!globalRows?.length) return [];

    return globalRows.map((s) => ({
      sourceId: s.id,
      title: s.name,
      excerpt: sourceIdHits.get(s.id)?.firstExcerpt ?? '',
      project: s.project_tag,
    }));
  }

  return sourceRows.slice(0, limit).map((s) => ({
    sourceId: s.id,
    title: s.name,
    excerpt: sourceIdHits.get(s.id)?.firstExcerpt ?? '',
    project: s.project_tag,
  }));
}

/**
 * Build a human-readable summary of knowledge matches for Clutch to include
 * in its Slack acknowledgement, so users know what context the agents have.
 */
export function formatKnowledgeMatchSummary(matches: KnowledgeMatch[]): string {
  if (matches.length === 0) return '';
  const titles = matches.map((m) => `*${m.title}*`).join(', ');
  return `📎 Knowledge attached: ${titles}`;
}
