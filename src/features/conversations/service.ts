import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Conversation, ConversationMessage } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type ConvRow = Tables<'conversations'>;
type MsgRow = Tables<'conversation_messages'>;

import type { ConversationChannelValue } from '@/lib/constants';

interface ConvAgentJoin {
  agent_id: string;
  agents: { id: string; name: string } | null;
}

type ConvJoinedRow = ConvRow & {
  agents?: { name: string } | null;
  conversation_agents?: ConvAgentJoin[];
  msg_count?: number;
};

function rowToConversation(row: ConvJoinedRow): Conversation {
  const participantAgents = (row.conversation_agents ?? [])
    .filter((ca): ca is ConvAgentJoin & { agents: { id: string; name: string } } => ca.agents !== null);

  return {
    id: row.id,
    agentId: row.agent_id,
    agentIds: participantAgents.length > 0
      ? participantAgents.map((ca) => ca.agents.id)
      : row.agent_id ? [row.agent_id] : [],
    agentName: row.agents?.name,
    agentNames: participantAgents.length > 0
      ? participantAgents.map((ca) => ca.agents.name)
      : row.agents?.name ? [row.agents.name] : [],
    createdBy: row.created_by,
    channel: (row.channel ?? 'web') as ConversationChannelValue,
    title: row.title ?? null,
    externalThreadId: row.external_thread_id ?? null,
    externalChannelId: row.external_channel_id ?? null,
    messageCount: row.msg_count,
    createdAt: row.created_at,
  };
}

function rowToMessage(row: MsgRow): ConversationMessage {
  const meta = row.metadata as Record<string, unknown> | undefined;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderName: (meta?.agentName as string) ?? (meta?.userName as string) ?? undefined,
    content: row.content,
    metadata: meta,
    createdAt: row.created_at,
  };
}

export async function listConversations(): Promise<Conversation[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*, agents!conversations_agent_id_fkey(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ConvJoinedRow[]).map((row) => rowToConversation(row));
}

export async function listConversationsForAgent(agentId: string): Promise<Conversation[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*, agents!conversations_agent_id_fkey(name)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ConvJoinedRow[]).map((row) => rowToConversation(row));
}

export interface RoundTableConversation extends Conversation {
  participants: { id: string; name: string }[];
}

export async function listRoundTableConversations(): Promise<RoundTableConversation[]> {
  const supabase = createBrowserSupabaseClient();

  const { data: caRows } = await supabase
    .from('conversation_agents')
    .select('conversation_id, agent_id, agents(id, name)')
    .order('added_at');

  if (!caRows || caRows.length === 0) return [];

  type CaRow = { conversation_id: string; agent_id: string; agents: { id: string; name: string } | null };
  const grouped = new Map<string, { id: string; name: string }[]>();
  for (const row of caRows as CaRow[]) {
    if (!row.agents) continue;
    const list = grouped.get(row.conversation_id) ?? [];
    list.push({ id: row.agents.id, name: row.agents.name });
    grouped.set(row.conversation_id, list);
  }

  const multiAgentIds = Array.from(grouped.entries())
    .filter(([, agents]) => agents.length >= 2)
    .map(([convId]) => convId);

  if (multiAgentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select('*, agents!conversations_agent_id_fkey(name)')
    .in('id', multiAgentIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as ConvJoinedRow[]).map((row) => ({
    ...rowToConversation(row),
    participants: grouped.get(row.id) ?? [],
  }));
}

export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');

  if (error) throw new Error(error.message);
  const msgs = ((data ?? []) as MsgRow[]).map(rowToMessage);

  const unresolvedUserIds = msgs
    .filter((m) => m.senderType === 'human' && !m.senderName && m.metadata?.userId)
    .map((m) => m.metadata!.userId as string);

  if (unresolvedUserIds.length > 0) {
    const uniqueIds = [...new Set(unresolvedUserIds)];
    // avatar_url added in migration 00010 — cast until DB types are regenerated
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', uniqueIds);

    type ProfileWithAvatar = { id: string; name: string; avatar_url: string | null };
    const profileRows = (profiles ?? []) as ProfileWithAvatar[];

    const profileMap = new Map(
      profileRows.map((p) => [
        p.id,
        { name: p.name, avatarUrl: p.avatar_url ?? null },
      ]),
    );

    for (const msg of msgs) {
      if (msg.senderType === 'human' && !msg.senderName && msg.metadata?.userId) {
        const profile = profileMap.get(msg.metadata.userId as string);
        if (profile) {
          msg.senderName = profile.name;
          msg.senderAvatarUrl = profile.avatarUrl ?? undefined;
        }
      }
    }
  }

  return msgs;
}

export async function getDocumentContent(
  sourceName: string,
): Promise<{ content: string; mimeType: string | null } | null> {
  const supabase = createBrowserSupabaseClient();

  const { data: source } = await supabase
    .from('knowledge_sources')
    .select('id, mime_type')
    .eq('name', sourceName)
    .single();

  if (!source) return null;

  const { data: contentRow } = await supabase
    .from('knowledge_content')
    .select('content')
    .eq('source_id', source.id)
    .eq('chunk_index', 0)
    .single();

  if (!contentRow) return null;

  return { content: contentRow.content, mimeType: source.mime_type };
}
