/**
 * POST /api/clutch/projects/explore
 *
 * Read-only project filesystem search for Clutch and sub-agents.
 *
 * Actions:
 *   list    — List all available project slugs
 *   search  — Search file content across one or all projects
 *   read    — Read the full content of a specific file by relative path
 *   structure — Get directory/key-file overview of a project
 *
 * This endpoint is Clutch-authenticated only. Never exposed to the browser.
 * Project files are READ-ONLY — no write operations are permitted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateClutchBearer } from '../../_lib/auth';
import {
  listProjects,
  searchProjectFiles,
  readProjectFile,
  getProjectStructure,
  PROJECTS_BASE_DIR,
} from '@/lib/projects/explorer';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
  'those', 'it', 'if', 'what', 'how', 'why', 'which', 'who', 'not', 'no',
  'please', 'want', 'need', 'get', 'make', 'create', 'update', 'about',
]);

function extractTerms(text: string, max = 6): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, max);
}

export async function POST(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json(
      { error: 'action is required: list | search | read | structure' },
      { status: 400 },
    );
  }

  switch (body.action) {
    // -------------------------------------------------------------------------
    case 'list': {
      const projects = listProjects();
      return NextResponse.json({
        projects,
        baseDir: PROJECTS_BASE_DIR,
        note: 'These projects are READ-ONLY. Do not attempt to write or push changes.',
      });
    }

    // -------------------------------------------------------------------------
    case 'search': {
      if (!body.query && !body.terms) {
        return NextResponse.json({ error: 'query or terms is required' }, { status: 400 });
      }

      const terms: string[] = Array.isArray(body.terms)
        ? body.terms
        : extractTerms(body.query ?? '');

      if (terms.length === 0) {
        return NextResponse.json({ results: [], terms });
      }

      const projectSlug: string | undefined = body.project ?? body.projectSlug;
      const limit = Math.min(parseInt(body.limit ?? '8', 10) || 8, 20);

      const matches = searchProjectFiles(terms, projectSlug, limit);

      return NextResponse.json({
        results: matches.map((m) => ({
          path: m.file.relativePath,
          name: m.file.name,
          ext: m.file.ext,
          projectSlug: m.projectSlug,
          hitCount: m.hitCount,
          excerpt: m.excerpt,
        })),
        terms,
        totalFound: matches.length,
      });
    }

    // -------------------------------------------------------------------------
    case 'read': {
      if (!body.path || typeof body.path !== 'string') {
        return NextResponse.json({ error: 'path is required' }, { status: 400 });
      }

      const result = readProjectFile(body.path);
      if (!result) {
        return NextResponse.json(
          { error: `File not found or unreadable: ${body.path}` },
          { status: 404 },
        );
      }

      return NextResponse.json({
        path: body.path,
        content: result.content,
        truncated: result.truncated,
        note: 'READ-ONLY. Do not attempt to modify or push this file.',
      });
    }

    // -------------------------------------------------------------------------
    case 'structure': {
      if (!body.project && !body.projectSlug) {
        return NextResponse.json({ error: 'project is required' }, { status: 400 });
      }

      const slug: string = body.project ?? body.projectSlug;
      const structure = getProjectStructure(slug);

      return NextResponse.json({
        ...structure,
        note: 'READ-ONLY. Agents may explore but not modify these projects.',
      });
    }

    // -------------------------------------------------------------------------
    default:
      return NextResponse.json(
        { error: `Unknown action: ${body.action}. Valid: list | search | read | structure` },
        { status: 400 },
      );
  }
}
