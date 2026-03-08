import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { fetchFileContent } from '@/lib/knowledge/google-drive';
import type { OAuthCredentials } from '@/lib/knowledge/types';
import type { Database, Json } from '@/lib/supabase/database.types';

const GOOGLE_URL_REGEX = /\/d\/([a-zA-Z0-9_-]+)/;

interface ResolveRequest {
  urls: string[];
  integrationId?: string;
}

interface ResolvedDoc {
  url: string;
  fileId: string;
  content: string | null;
  mimeType: string;
  charCount: number;
  error?: string;
}

async function authenticateBearerToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function mimeFromUrl(url: string): string {
  if (url.includes('/document/')) return 'application/vnd.google-apps.document';
  if (url.includes('/spreadsheets/')) return 'application/vnd.google-apps.spreadsheet';
  if (url.includes('/presentation/')) return 'application/vnd.google-apps.presentation';
  return 'application/vnd.google-apps.document';
}

export async function POST(req: NextRequest) {
  const user = await authenticateBearerToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: ResolveRequest = await req.json().catch(() => null);
  if (!body?.urls?.length) {
    return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
  }

  const svc = createServiceRoleClient();

  // Find a connected Google Drive integration
  let integrationId = body.integrationId;
  if (!integrationId) {
    const { data: integrations } = await svc
      .from('integrations')
      .select('id')
      .eq('type', 'google_drive')
      .eq('status', 'connected')
      .limit(1);

    if (!integrations?.length) {
      return NextResponse.json(
        { error: 'No connected Google Drive integration found' },
        { status: 404 },
      );
    }
    integrationId = (integrations[0] as { id: string }).id;
  }

  // Load OAuth credentials
  const { data: credRow } = await svc
    .from('integration_credentials')
    .select('credentials')
    .eq('integration_id', integrationId)
    .single();

  if (!credRow) {
    return NextResponse.json(
      { error: 'No credentials found for the integration' },
      { status: 404 },
    );
  }

  const creds = credRow.credentials as Record<string, unknown>;
  const credentials: OAuthCredentials = {
    refreshToken: creds.refreshToken as string,
    accessToken: (creds.accessToken as string) ?? null,
    tokenExpiry: (creds.tokenExpiry as string) ?? null,
  };

  if (!credentials.refreshToken) {
    return NextResponse.json(
      { error: 'Integration credentials missing refresh token' },
      { status: 500 },
    );
  }

  const documents: ResolvedDoc[] = [];

  for (const url of body.urls) {
    const match = url.match(GOOGLE_URL_REGEX);
    if (!match) {
      documents.push({ url, fileId: '', content: null, mimeType: '', charCount: 0, error: 'Could not parse file ID from URL' });
      continue;
    }

    const fileId = match[1];
    const mime = mimeFromUrl(url);

    try {
      const content = await fetchFileContent(credentials, fileId, mime);
      documents.push({
        url,
        fileId,
        content,
        mimeType: mime,
        charCount: content?.length ?? 0,
      });

      // Cache as knowledge source + content for future agent conversations
      if (content) {
        const sourceName = `Resolved: ${url.split('/d/')[0]?.split('/').pop() ?? fileId}`;
        const { data: source } = await svc
          .from('knowledge_sources')
          .insert({
            name: sourceName,
            type: 'Document',
            path: url,
            source_type: 'google_drive',
            external_id: fileId,
            integration_id: integrationId,
            fetch_status: 'fresh',
            last_fetched_at: new Date().toISOString(),
            mime_type: mime,
          } as never)
          .select('id')
          .single();

        if (source) {
          await svc.from('knowledge_content').insert({
            source_id: (source as { id: string }).id,
            content,
            chunk_index: 0,
            char_count: content.length,
          } as never);
        }
      }
    } catch (err) {
      documents.push({
        url,
        fileId,
        content: null,
        mimeType: mime,
        charCount: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch content',
      });
    }
  }

  return NextResponse.json({ documents });
}
