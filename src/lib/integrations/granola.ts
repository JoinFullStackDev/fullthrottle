/**
 * Granola API integration — meeting notes and summaries.
 *
 * Fetches recent meeting notes from Granola's Enterprise API.
 * Called automatically when an admin requests a status update.
 *
 * API base: https://public-api.granola.ai
 * Auth: Bearer token via GRANOLA_API_KEY env var
 * Docs: https://docs.granola.ai/api-reference/list-notes
 */

const GRANOLA_API_BASE = 'https://public-api.granola.ai';

export interface GranolaNote {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  attendees?: string[];
}

export interface GranolaNotesResult {
  notes: GranolaNote[];
  hasMore: boolean;
  error?: string;
}

function getApiKey(): string | null {
  return process.env.GRANOLA_API_KEY ?? null;
}

/**
 * Fetch recent meeting notes from Granola.
 *
 * @param since  ISO date string — only return notes created after this date.
 *               Defaults to 7 days ago.
 * @param limit  Max notes to return (1–30, Granola max per page)
 */
export async function fetchRecentNotes(
  since?: string,
  limit = 10,
): Promise<GranolaNotesResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      notes: [],
      hasMore: false,
      error: 'GRANOLA_API_KEY is not configured. Add it to your environment variables.',
    };
  }

  // Default: last 7 days
  const createdAfter = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    created_after: createdAfter,
    page_size: String(Math.min(limit, 30)),
  });

  try {
    const res = await fetch(`${GRANOLA_API_BASE}/v1/notes?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return {
        notes: [],
        hasMore: false,
        error: `Granola API error ${res.status}: ${body || res.statusText}`,
      };
    }

    const data = await res.json() as {
      notes: Array<{
        id: string;
        title?: string;
        created_at?: string;
        updated_at?: string;
        summary?: string;
        attendees?: Array<{ name?: string; email?: string }>;
      }>;
      hasMore?: boolean;
      cursor?: string;
    };

    const notes: GranolaNote[] = (data.notes ?? []).map((n) => ({
      id: n.id,
      title: n.title ?? 'Untitled meeting',
      createdAt: n.created_at ?? '',
      updatedAt: n.updated_at ?? '',
      summary: n.summary,
      attendees: (n.attendees ?? [])
        .map((a) => a.name ?? a.email ?? '')
        .filter(Boolean),
    }));

    return { notes, hasMore: data.hasMore ?? false };
  } catch (err) {
    return {
      notes: [],
      hasMore: false,
      error: `Failed to reach Granola API: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Format Granola notes into a concise update block for inclusion in
 * admin status updates (Slack or iMessage).
 */
export function formatNotesForUpdate(result: GranolaNotesResult): string {
  if (result.error) {
    return `⚠️ *Granola:* ${result.error}`;
  }

  if (result.notes.length === 0) {
    return `📓 *Granola:* No meeting notes in the last 7 days.`;
  }

  const lines: string[] = ['📓 *Recent meeting notes (Granola):*'];

  for (const note of result.notes) {
    const date = note.createdAt
      ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const attendees = note.attendees?.length
      ? ` · ${note.attendees.slice(0, 3).join(', ')}${note.attendees.length > 3 ? ` +${note.attendees.length - 3}` : ''}`
      : '';
    lines.push(`• *${note.title}* (${date}${attendees})`);
    if (note.summary) {
      // Truncate long summaries to keep updates scannable
      const summary = note.summary.length > 200
        ? note.summary.slice(0, 200) + '…'
        : note.summary;
      lines.push(`  ${summary}`);
    }
  }

  if (result.hasMore) {
    lines.push(`_…and more. Ask for notes on a specific meeting or date range for details._`);
  }

  return lines.join('\n');
}
