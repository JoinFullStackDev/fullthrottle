import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Conversation, ConversationMessage } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type ConvRow = Tables<'conversations'>;
type MsgRow = Tables<'conversation_messages'>;

import type { ConversationChannelValue } from '@/lib/constants';

function rowToConversation(row: ConvRow & { agents?: { name: string } | null; msg_count?: number }): Conversation {
  return {
    id: row.id,
    agentId: row.agent_id,
    agentName: row.agents?.name,
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
    .select('*, agents(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  type JoinedRow = ConvRow & { agents: { name: string } | null };
  return ((data ?? []) as JoinedRow[]).map((row) => rowToConversation(row));
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
