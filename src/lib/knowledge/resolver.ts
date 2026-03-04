import crypto from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkFileModified, fetchFileContent } from './google-drive';
import type { KnowledgeScopeConfig } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';
import type { ResolvedDocument, OAuthCredentials } from './types';

type KsRow = Tables<'knowledge_sources'>;

async function getCredentialsForIntegration(
  integrationId: string,
): Promise<OAuthCredentials | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('integration_id', integrationId)
    .single();

  if (!data) return null;

  const creds = data.credentials as Record<string, unknown>;
  const refreshToken = creds.refreshToken as string | undefined;

  if (!refreshToken) return null;

  return {
    refreshToken,
    accessToken: (creds.accessToken as string) ?? null,
    tokenExpiry: (creds.tokenExpiry as string) ?? null,
  };
}

function isExpired(source: KsRow): boolean {
  if (source.fetch_status === 'never_fetched') return true;
  if (source.fetch_status === 'error' || source.fetch_status === 'stale') return true;
  if (!source.last_fetched_at) return true;

  const fetchedAt = new Date(source.last_fetched_at).getTime();
  const intervalMs = (source.refresh_interval_minutes ?? 60) * 60 * 1000;
  return Date.now() > fetchedAt + intervalMs;
}

async function refreshSource(
  source: KsRow,
  credentials: OAuthCredentials,
): Promise<{ content: string; status: 'fresh' | 'stale' | 'error' }> {
  const supabase = createServiceRoleClient();

  if (!source.external_id || !source.mime_type) {
    return { content: '', status: 'error' };
  }

  try {
    if (source.fetch_status === 'fresh' || source.last_fetched_at) {
      const meta = await checkFileModified(credentials, source.external_id);

      if (meta.modifiedTime === source.last_modified_at) {
        await supabase
          .from('knowledge_sources')
          .update({
            fetch_status: 'fresh',
            last_fetched_at: new Date().toISOString(),
          })
          .eq('id', source.id);

        const { data: cached } = await supabase
          .from('knowledge_content')
          .select('content')
          .eq('source_id', source.id)
          .eq('chunk_index', 0)
          .single();

        if (cached?.content) {
          return { content: cached.content, status: 'fresh' };
        }
      }
    }

    const content = await fetchFileContent(
      credentials,
      source.external_id,
      source.mime_type,
    );

    if (content === null) {
      return { content: '', status: 'error' };
    }

    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    await supabase
      .from('knowledge_sources')
      .update({
        fetch_status: 'fresh',
        last_fetched_at: new Date().toISOString(),
        last_modified_at: (await checkFileModified(credentials, source.external_id)).modifiedTime,
        content_hash: contentHash,
      })
      .eq('id', source.id);

    await supabase
      .from('knowledge_content')
      .delete()
      .eq('source_id', source.id);

    await supabase.from('knowledge_content').insert({
      source_id: source.id,
      content,
      chunk_index: 0,
      char_count: content.length,
    });

    return { content, status: 'fresh' };
  } catch {
    await supabase
      .from('knowledge_sources')
      .update({ fetch_status: 'error' })
      .eq('id', source.id);

    const { data: staleCache } = await supabase
      .from('knowledge_content')
      .select('content')
      .eq('source_id', source.id)
      .eq('chunk_index', 0)
      .single();

    if (staleCache?.content) {
      return { content: staleCache.content, status: 'stale' };
    }

    return { content: '', status: 'error' };
  }
}

export async function resolveKnowledgeForAgent(
  agentId: string,
  knowledgeScope: KnowledgeScopeConfig | null,
): Promise<ResolvedDocument[]> {
  const supabase = createServiceRoleClient();
  const restrictedSources = knowledgeScope?.restrictedSources ?? [];

  // Fetch ALL knowledge sources, then filter in application code.
  // This avoids complex PostgREST OR queries that are fragile.
  const { data: allSources, error } = await supabase
    .from('knowledge_sources')
    .select('*')
    .in('source_type', ['google_drive', 'upload']);

  if (error) {
    console.error('[Knowledge resolver query error]', error.message);
    return [];
  }
  if (!allSources?.length) return [];

  const allowedFolders = knowledgeScope?.allowedFolders ?? [];
  const allowedProjects = knowledgeScope?.allowedProjects ?? [];

  const filtered = (allSources as KsRow[]).filter((s) => {
    // Exclude restricted sources
    if (restrictedSources.length > 0) {
      if (s.folder_tag && restrictedSources.includes(s.folder_tag)) return false;
      if (s.name && restrictedSources.includes(s.name)) return false;
    }

    // Exclude docs assigned to a different agent
    if (s.agent_id && s.agent_id !== agentId) return false;

    // Include if directly assigned to this agent
    if (s.agent_id === agentId) return true;

    // Include if folder_tag matches agent's allowedFolders
    if (s.folder_tag && allowedFolders.includes(s.folder_tag)) return true;

    // Include if project_tag matches agent's allowedProjects
    if (s.project_tag && allowedProjects.includes(s.project_tag)) return true;

    // Include if unscoped (no agent, no folder tag)
    if (!s.agent_id && !s.folder_tag) return true;

    return false;
  });

  const credentialsCache = new Map<string, OAuthCredentials | null>();
  const results: ResolvedDocument[] = [];

  for (const source of filtered) {
    if (source.source_type === 'google_drive' && source.integration_id) {
      if (!credentialsCache.has(source.integration_id)) {
        credentialsCache.set(
          source.integration_id,
          await getCredentialsForIntegration(source.integration_id),
        );
      }
      const creds = credentialsCache.get(source.integration_id);

      if (!creds) {
        results.push({
          name: source.name,
          sourceType: source.source_type,
          content: '',
          lastVerified: source.last_fetched_at ?? 'Never',
          status: 'error',
          charCount: 0,
        });
        continue;
      }

      if (isExpired(source)) {
        const { content, status } = await refreshSource(source, creds);
        results.push({
          name: source.name,
          sourceType: source.source_type,
          content,
          lastVerified: new Date().toISOString(),
          status,
          charCount: content.length,
        });
      } else {
        const { data: cached } = await supabase
          .from('knowledge_content')
          .select('content, char_count')
          .eq('source_id', source.id)
          .eq('chunk_index', 0)
          .single();

        results.push({
          name: source.name,
          sourceType: source.source_type,
          content: cached?.content ?? '',
          lastVerified: source.last_fetched_at ?? 'Unknown',
          status: 'fresh',
          charCount: cached?.char_count ?? 0,
        });
      }
    } else if (source.source_type === 'upload') {
      const { data: cached } = await supabase
        .from('knowledge_content')
        .select('content, char_count')
        .eq('source_id', source.id)
        .eq('chunk_index', 0)
        .single();

      if (cached?.content) {
        results.push({
          name: source.name,
          sourceType: 'upload',
          content: cached.content,
          lastVerified: source.last_fetched_at ?? source.created_at,
          status: 'fresh',
          charCount: cached.char_count ?? cached.content.length,
        });
      }
    }
  }

  return results.filter((d) => d.content.length > 0);
}

export async function resolveDocumentsByIds(
  documentIds: string[],
): Promise<ResolvedDocument[]> {
  if (documentIds.length === 0) return [];

  const supabase = createServiceRoleClient();
  const { data: sources } = await supabase
    .from('knowledge_sources')
    .select('*')
    .in('id', documentIds);

  if (!sources?.length) return [];

  const results: ResolvedDocument[] = [];

  for (const source of sources as KsRow[]) {
    const { data: cached } = await supabase
      .from('knowledge_content')
      .select('content, char_count')
      .eq('source_id', source.id)
      .eq('chunk_index', 0)
      .single();

    if (cached?.content) {
      results.push({
        name: source.name,
        sourceType: source.source_type,
        content: cached.content,
        lastVerified: source.last_fetched_at ?? source.created_at,
        status: 'fresh',
        charCount: cached.char_count ?? cached.content.length,
      });
    }
  }

  return results;
}

export async function forceRefreshSource(sourceId: string): Promise<ResolvedDocument | null> {
  const supabase = createServiceRoleClient();

  const { data: source } = await supabase
    .from('knowledge_sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  if (!source) return null;
  const ksRow = source as KsRow;

  if (ksRow.source_type !== 'google_drive' || !ksRow.integration_id) return null;

  const creds = await getCredentialsForIntegration(ksRow.integration_id);
  if (!creds) return null;

  const { content, status } = await refreshSource(ksRow, creds);

  return {
    name: ksRow.name,
    sourceType: ksRow.source_type,
    content,
    lastVerified: new Date().toISOString(),
    status,
    charCount: content.length,
  };
}
