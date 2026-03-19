/**
 * Project Explorer — read-only filesystem access for client project codebases.
 *
 * Client projects live under PROJECTS_BASE_DIR. They are extracted from private
 * repositories and are READ-ONLY. Agents may explore them to answer questions,
 * write documentation, plan features, and suggest code changes — but must never
 * attempt to push or commit changes to these directories.
 *
 * Directory layout (convention):
 *   PROJECTS_BASE_DIR/
 *     <project-slug>/          e.g. marketplace, fullstackrx, lms
 *       <repo-folder>/         e.g. invessio-marketplace-ui-dev
 *         src/
 *         README.md
 *         ...
 *
 * The project slug should match the FullThrottle project tag where possible.
 */

import fs from 'fs';
import path from 'path';

export const PROJECTS_BASE_DIR = '/Users/spencergreen/Desktop/fullstack/projects';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectFile {
  /** Path relative to PROJECTS_BASE_DIR */
  relativePath: string;
  /** Absolute path — never exposed to the LLM directly */
  absolutePath: string;
  /** File name only */
  name: string;
  /** File extension */
  ext: string;
  /** Size in bytes */
  sizeBytes: number;
}

export interface ProjectMatch {
  file: ProjectFile;
  /** Snippet of content around the matched term */
  excerpt: string;
  /** Number of search terms matched in this file */
  hitCount: number;
  /** Project slug this file belongs to */
  projectSlug: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** File extensions worth reading for code/doc search */
const READABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx',
  '.md', '.mdx', '.txt',
  '.json', '.yaml', '.yml',
  '.css', '.scss',
  '.html', '.env.example.public',
]);

/** Directories to always skip when traversing */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next',
  'coverage', '.turbo', '.cache', '__pycache__', '.DS_Store',
  'ct-vrt', // visual regression snapshots — binary, not useful
]);

/** Max file size to read in full (2 MB) */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

/**
 * List all available project slugs (top-level folders under PROJECTS_BASE_DIR).
 */
export function listProjects(): string[] {
  try {
    return fs
      .readdirSync(PROJECTS_BASE_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Recursively collect all readable files under a directory.
 */
function collectFiles(dir: string, baseDir: string, results: ProjectFile[] = []): ProjectFile[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example.public') continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        collectFiles(fullPath, baseDir, results);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (READABLE_EXTENSIONS.has(ext) || READABLE_EXTENSIONS.has(entry.name)) {
        let sizeBytes = 0;
        try {
          sizeBytes = fs.statSync(fullPath).size;
        } catch { /* ignore */ }

        results.push({
          relativePath: path.relative(baseDir, fullPath),
          absolutePath: fullPath,
          name: entry.name,
          ext,
          sizeBytes,
        });
      }
    }
  }

  return results;
}

/**
 * Read a file's content safely, respecting the size limit.
 */
function readFileSafe(absolutePath: string): string | null {
  try {
    const stat = fs.statSync(absolutePath);
    if (stat.size > MAX_FILE_SIZE_BYTES) return null; // too large
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch {
    return null;
  }
}

function buildExcerpt(content: string, term: string, contextChars = 150): string {
  const lowerContent = content.toLowerCase();
  const matchIdx = lowerContent.indexOf(term.toLowerCase());
  if (matchIdx === -1) return content.slice(0, contextChars * 2);
  const start = Math.max(0, matchIdx - contextChars);
  const end = Math.min(content.length, matchIdx + term.length + contextChars);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search project files for content matching the given terms.
 *
 * @param terms        Search keywords (pre-extracted)
 * @param projectSlug  If provided, restrict to that project slug. Otherwise search all.
 * @param limit        Max results to return (default 8)
 */
export function searchProjectFiles(
  terms: string[],
  projectSlug?: string,
  limit = 8,
): ProjectMatch[] {
  if (terms.length === 0) return [];

  const slugs = projectSlug
    ? [projectSlug]
    : listProjects();

  const matches: ProjectMatch[] = [];

  for (const slug of slugs) {
    const projectDir = path.join(PROJECTS_BASE_DIR, slug);
    const files = collectFiles(projectDir, PROJECTS_BASE_DIR);

    for (const file of files) {
      // Prioritise README and .md files — most likely to answer high-level questions
      const content = readFileSafe(file.absolutePath);
      if (!content) continue;

      const lowerContent = content.toLowerCase();
      let hitCount = 0;
      let firstExcerpt = '';

      for (const term of terms) {
        if (lowerContent.includes(term.toLowerCase())) {
          hitCount++;
          if (!firstExcerpt) {
            firstExcerpt = buildExcerpt(content, term);
          }
        }
      }

      if (hitCount > 0) {
        matches.push({
          file,
          excerpt: firstExcerpt,
          hitCount,
          projectSlug: slug,
        });
      }
    }
  }

  // Sort: more term hits first, then prefer .md files, then smaller files
  matches.sort((a, b) => {
    if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
    const aIsMd = a.file.ext === '.md' ? 0 : 1;
    const bIsMd = b.file.ext === '.md' ? 0 : 1;
    if (aIsMd !== bIsMd) return aIsMd - bIsMd;
    return a.file.sizeBytes - b.file.sizeBytes;
  });

  return matches.slice(0, limit);
}

/**
 * Read the full content of a specific project file by relative path.
 * Used when a sub-agent needs to deeply explore a specific file.
 *
 * @param relativePath  Path relative to PROJECTS_BASE_DIR
 */
export function readProjectFile(relativePath: string): { content: string; truncated: boolean } | null {
  // Security: prevent path traversal outside PROJECTS_BASE_DIR
  const absolute = path.resolve(PROJECTS_BASE_DIR, relativePath);
  if (!absolute.startsWith(PROJECTS_BASE_DIR)) {
    return null;
  }

  const content = readFileSafe(absolute);
  if (content === null) {
    // Try truncated read for oversized files
    try {
      const fd = fs.openSync(absolute, 'r');
      const buf = Buffer.alloc(MAX_FILE_SIZE_BYTES);
      const bytesRead = fs.readSync(fd, buf, 0, MAX_FILE_SIZE_BYTES, 0);
      fs.closeSync(fd);
      return {
        content: buf.slice(0, bytesRead).toString('utf-8') + '\n\n[File truncated — exceeds 2 MB read limit]',
        truncated: true,
      };
    } catch {
      return null;
    }
  }

  return { content, truncated: false };
}

/**
 * Get a structural overview of a project: top-level dirs and key files.
 * Useful as a first step before deep file search.
 */
export function getProjectStructure(projectSlug: string): {
  slug: string;
  repoDirs: string[];
  keyFiles: string[];
} {
  const projectDir = path.join(PROJECTS_BASE_DIR, projectSlug);

  let repoDirs: string[] = [];
  try {
    repoDirs = fs
      .readdirSync(projectDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch { /* no-op */ }

  // Surface README and package.json from each repo dir as key context files
  const keyFiles: string[] = [];
  for (const repoDir of repoDirs) {
    for (const candidate of ['README.md', 'package.json']) {
      const p = path.join(projectDir, repoDir, candidate);
      if (fs.existsSync(p)) {
        keyFiles.push(path.relative(PROJECTS_BASE_DIR, p));
      }
    }
  }

  return { slug: projectSlug, repoDirs, keyFiles };
}
