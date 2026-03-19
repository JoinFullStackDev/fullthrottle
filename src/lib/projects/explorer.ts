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
  // TypeScript / JavaScript (frontend)
  '.ts', '.tsx', '.js', '.jsx',
  // Java / Kotlin (backend)
  '.java', '.kt', '.kts',
  // Config / infra
  '.yaml', '.yml', '.json', '.properties', '.toml', '.env.example.public',
  // Docs
  '.md', '.mdx', '.txt',
  // Web
  '.css', '.scss', '.html',
  // Gradle build files (no extension match needed — handled by name below)
]);

/** Specific filenames to always include regardless of extension */
const READABLE_FILENAMES = new Set([
  'build.gradle', 'settings.gradle', 'build.gradle.kts', 'settings.gradle.kts',
  'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  'README', 'CHANGELOG',
]);

/** Directories to always skip when traversing */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next',
  'coverage', '.turbo', '.cache', '__pycache__',
  'ct-vrt',           // visual regression snapshots — binary PNGs
  'storybook-static', // built storybook — not useful
  'json-test-results',// test output artifacts
  'gradle',           // gradle wrapper binaries
  '.gradle',
  'e2e',              // e2e test snapshots/videos
  '__snapshots__',
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
      if (READABLE_EXTENSIONS.has(ext) || READABLE_FILENAMES.has(entry.name)) {
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

    // Walk frontend/ and backend/ separately so we never miss one due to
    // the intermediate layer (slug → frontend/backend → repo-name → src)
    const files: ProjectFile[] = [];
    for (const tier of ['frontend', 'backend']) {
      const tierDir = path.join(projectDir, tier);
      if (fs.existsSync(tierDir)) {
        collectFiles(tierDir, PROJECTS_BASE_DIR, files);
      }
    }
    // Fallback: if neither frontend/ nor backend/ exists, walk root
    if (files.length === 0) {
      collectFiles(projectDir, PROJECTS_BASE_DIR, files);
    }

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
 * Get a structural overview of a project.
 *
 * Projects follow the convention:
 *   <slug>/frontend/<repo>/
 *   <slug>/backend/<repo>/
 *
 * Returns repo locations, detected languages, and key files
 * (READMEs, package.json, build.gradle, .plans docs).
 */
export function getProjectStructure(projectSlug: string): {
  slug: string;
  frontend: { repoDir: string; keyFiles: string[] } | null;
  backend: { repoDir: string; language: 'java' | 'typescript' | 'unknown'; keyFiles: string[] } | null;
  plansDocs: string[];
} {
  const projectDir = path.join(PROJECTS_BASE_DIR, projectSlug);

  function firstSubdir(parentPath: string): string | null {
    try {
      const entries = fs.readdirSync(parentPath, { withFileTypes: true });
      const dir = entries.find((e) => e.isDirectory() && !e.name.startsWith('.'));
      return dir ? dir.name : null;
    } catch { return null; }
  }

  function findKeyFiles(repoPath: string): string[] {
    const candidates = [
      'README.md', 'package.json', 'build.gradle', 'build.gradle.kts',
      'settings.gradle', 'settings.gradle.kts',
    ];
    const found: string[] = [];
    for (const c of candidates) {
      const p = path.join(repoPath, c);
      if (fs.existsSync(p)) found.push(path.relative(PROJECTS_BASE_DIR, p));
    }
    return found;
  }

  function detectLanguage(repoPath: string): 'java' | 'typescript' | 'unknown' {
    if (fs.existsSync(path.join(repoPath, 'build.gradle')) ||
        fs.existsSync(path.join(repoPath, 'build.gradle.kts'))) return 'java';
    if (fs.existsSync(path.join(repoPath, 'package.json'))) return 'typescript';
    return 'unknown';
  }

  // frontend
  const frontendBase = path.join(projectDir, 'frontend');
  const frontendRepo = firstSubdir(frontendBase);
  const frontendResult = frontendRepo
    ? { repoDir: `${projectSlug}/frontend/${frontendRepo}`, keyFiles: findKeyFiles(path.join(frontendBase, frontendRepo)) }
    : null;

  // backend
  const backendBase = path.join(projectDir, 'backend');
  const backendRepo = firstSubdir(backendBase);
  const backendRepoPath = backendRepo ? path.join(backendBase, backendRepo) : null;
  const backendResult = backendRepo && backendRepoPath
    ? {
        repoDir: `${projectSlug}/backend/${backendRepo}`,
        language: detectLanguage(backendRepoPath),
        keyFiles: findKeyFiles(backendRepoPath),
      }
    : null;

  // .plans docs (feature plans, notes) — often inside the frontend repo
  const plansDocs: string[] = [];
  if (frontendRepo) {
    const plansDir = path.join(frontendBase, frontendRepo, '.plans');
    try {
      const planFiles = fs.readdirSync(plansDir, { withFileTypes: true });
      for (const f of planFiles) {
        if (f.isFile() && f.name.endsWith('.md')) {
          plansDocs.push(path.relative(PROJECTS_BASE_DIR, path.join(plansDir, f.name)));
        }
      }
    } catch { /* no .plans dir */ }
  }

  return { slug: projectSlug, frontend: frontendResult, backend: backendResult, plansDocs };
}
