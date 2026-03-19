/**
 * Knowledge auto-enrichment for Clutch intake.
 *
 * When Clutch receives a Slack request and builds an intake payload, it should
 * call `enrichIntakeWithKnowledge` before submitting to POST /api/clutch/intake.
 *
 * This searches THREE knowledge sources in priority order:
 *   1. Indexed knowledge base (uploaded files, Google Drive docs) — Supabase
 *   2. Repo docs/ folder — design guides, architecture, overview, plan files
 *   3. Agent persona docs — _AGENTS/*/persona.md
 *
 * Results from all three are merged and deduped. Source IDs from the indexed
 * knowledge base are attached to the intake payload for agent grounding.
 * Doc-folder matches are surfaced in Clutch's Slack confirmation so the agent
 * knows what context is available even if it isn't DB-indexed.
 *
 * If no results are found in any source, the intake proceeds unchanged —
 * enrichment is always best-effort and never blocks the request.
 */

import fs from 'fs';
import path from 'path';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { searchProjectFiles } from '@/lib/projects/explorer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeMatch {
  /** DB source ID — only present for indexed knowledge base matches */
  sourceId?: string;
  title: string;
  excerpt: string;
  project: string | null;
  /** Where the match came from */
  source: 'knowledge_base' | 'docs' | 'agent_persona' | 'project_files';
  /** Relative file path — only present for project_files matches */
  filePath?: string;
}

// ---------------------------------------------------------------------------
// Stopwords / keyword extraction
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'if', 'when', 'what', 'how', 'why',
  'which', 'who', 'they', 'their', 'there', 'then', 'than', 'not', 'no',
  'any', 'all', 'also', 'so', 'just', 'we', 'i', 'you', 'he', 'she',
  'please', 'want', 'need', 'should', 'get', 'make', 'create', 'update',
  'about', 'some', 'into', 'out', 'up', 'down', 'here', 'where', 'like',
]);

function extractSearchTerms(text: string, maxTerms = 6): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const uniqueWords = [...new Set(words)];
  // Sort by length descending — longer words tend to be more domain-specific
  return uniqueWords.sort((a, b) => b.length - a.length).slice(0, maxTerms);
}

function buildExcerpt(content: string, term: string, contextChars = 100): string {
  const lowerContent = content.toLowerCase();
  const matchIdx = lowerContent.indexOf(term.toLowerCase());
  if (matchIdx === -1) return content.slice(0, contextChars * 2);

  const start = Math.max(0, matchIdx - contextChars);
  const end = Math.min(content.length, matchIdx + term.length + contextChars);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

// ---------------------------------------------------------------------------
// Source 1: Indexed knowledge base (Supabase knowledge_content)
// ---------------------------------------------------------------------------

interface DbMatch {
  sourceId: string;
  hitCount: number;
  firstExcerpt: string;
}

async function searchKnowledgeBase(
  terms: string[],
  projectTag: string,
  limit = 5,
): Promise<KnowledgeMatch[]> {
  const svc = createServiceRoleClient();
  const sourceHits = new Map<string, DbMatch>();

  await Promise.all(
    terms.map(async (term) => {
      const { data: contentRows } = await svc
        .from('knowledge_content')
        .select('id, source_id, content')
        .ilike('content', `%${term}%`)
        .limit(10);

      for (const row of contentRows ?? []) {
        const existing = sourceHits.get(row.source_id);
        if (existing) {
          existing.hitCount += 1;
        } else {
          sourceHits.set(row.source_id, {
            sourceId: row.source_id,
            hitCount: 1,
            firstExcerpt: buildExcerpt(row.content, term),
          });
        }
      }
    }),
  );

  if (sourceHits.size === 0) return [];

  const rankedIds = [...sourceHits.entries()]
    .sort((a, b) => b[1].hitCount - a[1].hitCount)
    .map(([id]) => id);

  // Prefer project-tagged sources, fall back to untagged (global) docs
  let { data: sourceRows } = await svc
    .from('knowledge_sources')
    .select('id, name, project_tag')
    .in('id', rankedIds)
    .eq('project_tag', projectTag)
    .limit(limit);

  if (!sourceRows?.length) {
    const { data: globalRows } = await svc
      .from('knowledge_sources')
      .select('id, name, project_tag')
      .in('id', rankedIds)
      .is('project_tag', null)
      .limit(limit);
    sourceRows = globalRows ?? [];
  }

  return (sourceRows ?? []).map((s) => ({
    sourceId: s.id,
    title: s.name,
    excerpt: sourceHits.get(s.id)?.firstExcerpt ?? '',
    project: s.project_tag,
    source: 'knowledge_base' as const,
  }));
}

// ---------------------------------------------------------------------------
// Source 2: Repo docs/ folder
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .md files under a directory.
 * Skips _AGENTS subdirectory (handled separately in Source 3).
 */
function collectDocFiles(dir: string, skipDirs = new Set(['_AGENTS'])): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        results.push(...collectDocFiles(path.join(dir, entry.name), skipDirs));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function searchDocFiles(filePaths: string[], terms: string[], limit = 3): KnowledgeMatch[] {
  const matches: Array<{ path: string; hitCount: number; excerpt: string }> = [];

  for (const filePath of filePaths) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const lowerContent = content.toLowerCase();
    let hitCount = 0;
    let firstExcerpt = '';

    for (const term of terms) {
      if (lowerContent.includes(term)) {
        hitCount++;
        if (!firstExcerpt) {
          firstExcerpt = buildExcerpt(content, term);
        }
      }
    }

    if (hitCount > 0) {
      matches.push({ path: filePath, hitCount, excerpt: firstExcerpt });
    }
  }

  return matches
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, limit)
    .map((m) => ({
      title: path.basename(m.path, '.md'),
      excerpt: m.excerpt,
      project: null,
      source: 'docs' as const,
    }));
}

// ---------------------------------------------------------------------------
// Source 3: Agent persona docs (_AGENTS/*/persona.md)
// ---------------------------------------------------------------------------

function searchAgentPersonas(docsDir: string, terms: string[], limit = 2): KnowledgeMatch[] {
  const agentsDir = path.join(docsDir, '_AGENTS');
  let agentDirs: fs.Dirent[];
  try {
    agentDirs = fs.readdirSync(agentsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const personaFiles = agentDirs
    .filter((e) => e.isDirectory())
    .map((e) => path.join(agentsDir, e.name, 'persona.md'))
    .filter((p) => fs.existsSync(p));

  // Also include the shared guidelines doc
  const guidelinesPath = path.join(agentsDir, '00_AGENT_GUIDELINES.md');
  if (fs.existsSync(guidelinesPath)) {
    personaFiles.unshift(guidelinesPath);
  }

  return searchDocFiles(personaFiles, terms, limit).map((m) => ({
    ...m,
    source: 'agent_persona' as const,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Source 4: Client project files (read-only extracted codebases)
// ---------------------------------------------------------------------------

function searchProjectFileSource(terms: string[], projectTag: string, limit = 5): KnowledgeMatch[] {
  // Map project tag to project slug — tags may use hyphens, slugs are folder names
  // Convention: try exact match first, then strip hyphens
  const matches = searchProjectFiles(terms, projectTag, limit);

  if (matches.length === 0 && projectTag) {
    // Fallback: search without project filter in case slug doesn't match tag exactly
    const allMatches = searchProjectFiles(terms, undefined, limit);
    return allMatches.map((m) => ({
      title: m.file.name,
      excerpt: m.excerpt,
      project: m.projectSlug,
      source: 'project_files' as const,
      filePath: m.file.relativePath,
    }));
  }

  return matches.map((m) => ({
    title: m.file.name,
    excerpt: m.excerpt,
    project: m.projectSlug,
    source: 'project_files' as const,
    filePath: m.file.relativePath,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search all four knowledge sources for content relevant to a request.
 *
 * Priority order:
 *   1. Indexed knowledge base (Supabase) — PRDs, SOWs, uploaded docs
 *   2. Repo docs/ folder — design guides, architecture, planning
 *   3. Agent persona docs — when request touches agent behavior
 *   4. Client project files — source code, READMEs, configs in ~/Desktop/fullstack/projects
 *
 * @param requestText  The raw Slack message text
 * @param projectTag   The project slug identified from the request
 * @param limit        Max results per source (default 5 for KB, 3 for docs/personas/projects)
 */
export async function findRelevantKnowledgeSources(
  requestText: string,
  projectTag: string,
  limit = 5,
): Promise<KnowledgeMatch[]> {
  const terms = extractSearchTerms(requestText);
  if (terms.length === 0) return [];

  const docsDir = path.join(process.cwd(), 'docs');

  // Fan out all four searches in parallel
  const [kbMatches, docMatches, personaMatches, projectMatches] = await Promise.all([
    searchKnowledgeBase(terms, projectTag, limit),
    Promise.resolve(searchDocFiles(collectDocFiles(docsDir), terms, 3)),
    Promise.resolve(searchAgentPersonas(docsDir, terms, 2)),
    Promise.resolve(searchProjectFileSource(terms, projectTag, 4)),
  ]);

  // Merge, dedup by title — KB and docs first (higher authority), projects last
  const seen = new Set<string>();
  const all: KnowledgeMatch[] = [];
  for (const match of [...kbMatches, ...docMatches, ...personaMatches, ...projectMatches]) {
    if (!seen.has(match.title)) {
      seen.add(match.title);
      all.push(match);
    }
  }

  return all;
}

/**
 * Extract only the DB source IDs (for attaching to intake payloads).
 * Only knowledge_base matches have sourceIds.
 */
export function extractSourceIds(matches: KnowledgeMatch[]): string[] {
  return matches
    .filter((m) => m.source === 'knowledge_base' && m.sourceId)
    .map((m) => m.sourceId!);
}

/**
 * Build a human-readable Slack summary of what knowledge was found.
 * Groups by source type so the user can see where context is coming from.
 */
export function formatKnowledgeMatchSummary(matches: KnowledgeMatch[]): string {
  if (matches.length === 0) {
    return '⚠️ No relevant docs found in the knowledge base or project files. If there\'s a PRD or spec for this, drop the link and I\'ll index it.';
  }

  const kbDocs = matches.filter((m) => m.source === 'knowledge_base');
  const repoDocs = matches.filter((m) => m.source === 'docs');
  const projectFiles = matches.filter((m) => m.source === 'project_files');

  const parts: string[] = [];
  if (kbDocs.length > 0) {
    parts.push(`📎 *Knowledge base:* ${kbDocs.map((m) => m.title).join(', ')}`);
  }
  if (repoDocs.length > 0) {
    parts.push(`📄 *Docs:* ${repoDocs.map((m) => m.title).join(', ')}`);
  }
  if (projectFiles.length > 0) {
    parts.push(`🗂️ *Project files:* ${projectFiles.map((m) => m.title).join(', ')}`);
  }

  return parts.join('\n');
}
