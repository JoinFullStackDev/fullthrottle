import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { KnowledgeSource } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type KsRow = Tables<'knowledge_sources'>;

function rowToKnowledgeSource(row: KsRow & { agents?: { name: string } | null }): KnowledgeSource {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    path: row.path,
    sourceType: row.source_type,
    externalId: row.external_id,
    integrationId: row.integration_id,
    agentId: row.agent_id,
    agentName: row.agents?.name,
    folderTag: row.folder_tag,
    projectTag: row.project_tag,
    contentHash: row.content_hash,
    lastFetchedAt: row.last_fetched_at,
    lastModifiedAt: row.last_modified_at,
    fetchStatus: row.fetch_status,
    refreshIntervalMinutes: row.refresh_interval_minutes,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

export async function listKnowledgeSources(): Promise<KnowledgeSource[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('knowledge_sources')
    .select('*, agents(name)')
    .order('name');

  if (error) throw new Error(error.message);
  type JoinedRow = KsRow & { agents: { name: string } | null };
  return ((data ?? []) as JoinedRow[]).map(rowToKnowledgeSource);
}

export async function getKnowledgeSourcesByIds(ids: string[]): Promise<KnowledgeSource[]> {
  if (ids.length === 0) return [];
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('knowledge_sources')
    .select('*, agents(name)')
    .in('id', ids);

  if (error) throw new Error(error.message);
  type JoinedRow = KsRow & { agents: { name: string } | null };
  return ((data ?? []) as JoinedRow[]).map(rowToKnowledgeSource);
}

export async function getKnowledgeContent(sourceId: string): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('knowledge_content')
    .select('content')
    .eq('source_id', sourceId)
    .eq('chunk_index', 0)
    .single();

  if (error) return null;
  return (data as { content: string })?.content ?? null;
}

export async function createKnowledgeSource(
  input: Omit<KnowledgeSource, 'id' | 'createdAt' | 'agentName' | 'contentHash' | 'lastFetchedAt' | 'lastModifiedAt' | 'fetchStatus'>,
): Promise<KnowledgeSource> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('knowledge_sources')
    .insert({
      name: input.name,
      type: input.type,
      path: input.path,
      source_type: input.sourceType,
      external_id: input.externalId,
      integration_id: input.integrationId,
      agent_id: input.agentId,
      folder_tag: input.folderTag,
      project_tag: input.projectTag,
      refresh_interval_minutes: input.refreshIntervalMinutes,
      mime_type: input.mimeType,
    } as never)
    .select('*, agents(name)')
    .single();

  if (error) throw new Error(error.message);
  type JoinedRow = KsRow & { agents: { name: string } | null };
  return rowToKnowledgeSource(data as JoinedRow);
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from('knowledge_sources')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function refreshKnowledgeSource(id: string): Promise<KnowledgeSource> {
  const res = await fetch(`/api/knowledge/${id}/refresh`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Refresh failed: ${res.status}`);
  }
  const { source } = await res.json();
  return source;
}

export async function discoverDriveContents(
  integrationId: string,
  folderId: string,
): Promise<{
  folders: Array<{ id: string; name: string }>;
  files: Array<{ id: string; name: string; mimeType: string; modifiedTime: string; supported: boolean; isFolder: boolean }>;
}> {
  const res = await fetch('/api/knowledge/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, folderId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Discovery failed: ${res.status}`);
  }
  return await res.json();
}

export async function discoverDriveRoots(
  integrationId: string,
): Promise<Array<{ id: string; name: string; kind: string }>> {
  const res = await fetch('/api/knowledge/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, action: 'listRoots' }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to list drives: ${res.status}`);
  }
  const { roots } = await res.json();
  return roots;
}
