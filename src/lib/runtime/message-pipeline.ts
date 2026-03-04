import { createServiceRoleClient } from '@/lib/supabase/server';
import { assembleSystemPrompt } from './persona-assembler';
import { resolveKnowledgeForAgent, resolveDocumentsByIds } from '@/lib/knowledge/resolver';
import { getProvider } from './providers/registry';
import type { StreamChunk, ChatMessage } from './providers/types';
import type { ResolvedDocument } from '@/lib/knowledge/types';
import type { Tables, Json } from '@/lib/supabase/database.types';

const MAX_HISTORY_MESSAGES = 50;

type AgentRow = Tables<'agents'>;
type MsgRow = Tables<'conversation_messages'>;

interface PipelineParams {
  agentId: string;
  conversationId: string;
  userMessage: string;
  userId: string;
  channel: 'web' | 'slack';
  documentIds?: string[];
}

async function getAgent(agentId: string): Promise<AgentRow> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error || !data) throw new Error(`Agent not found: ${agentId}`);
  return data as AgentRow;
}

async function loadHistory(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  if (error) throw new Error(`Failed to load history: ${error.message}`);

  return ((data ?? []) as MsgRow[])
    .filter((m) => m.sender_type !== 'system')
    .map((m) => ({
      role: m.sender_type === 'human' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));
}

async function storeMessage(
  conversationId: string,
  senderType: 'human' | 'agent' | 'system',
  content: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('conversation_messages').insert({
    conversation_id: conversationId,
    sender_type: senderType,
    content,
    metadata: (metadata ?? {}) as Json,
  });
  if (error) throw new Error(`Failed to store message: ${error.message}`);
}

async function logUsage(
  agentId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
) {
  const supabase = createServiceRoleClient();
  await supabase.from('usage_events').insert({
    agent_id: agentId,
    model,
    token_count: promptTokens + completionTokens,
    cost_estimate: 0,
  });
}

function formatKnowledgeSection(docs: ResolvedDocument[]): string {
  if (docs.length === 0) return '';

  const sections: string[] = [
    '',
    '## Reference Documents',
    '',
    'Use these documents to ground your responses. Cite the document name when referencing specific information.',
    '',
  ];

  for (const doc of docs) {
    const statusLabel = doc.status === 'fresh'
      ? 'Fresh'
      : doc.status === 'stale'
        ? 'Stale (could not refresh — content may be outdated)'
        : 'Error';

    sections.push(`### ${doc.name}`);
    sections.push(`Source: ${doc.sourceType} | Last verified: ${doc.lastVerified} | Status: ${statusLabel}`);
    sections.push('');
    sections.push(doc.content);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Channel-agnostic message pipeline. Yields StreamChunks for SSE consumption.
 * After the stream completes, stores the agent response and logs usage.
 */
export async function* processAgentMessage(
  params: PipelineParams,
): AsyncGenerator<StreamChunk> {
  const { agentId, conversationId, userMessage, userId, channel, documentIds } = params;

  const agent = await getAgent(agentId);
  const { systemPrompt, knowledgeScope } = await assembleSystemPrompt(
    agentId,
    agent.name,
    agent.role,
    agent,
  );

  let fullPrompt = systemPrompt;
  let knowledgeDocs: ResolvedDocument[] = [];

  try {
    knowledgeDocs = await resolveKnowledgeForAgent(agentId, knowledgeScope);
  } catch (knowledgeErr) {
    console.error('[Knowledge resolution error]', knowledgeErr);
  }

  if (documentIds && documentIds.length > 0) {
    try {
      const referencedDocs = await resolveDocumentsByIds(documentIds);
      const existingNames = new Set(knowledgeDocs.map((d) => d.name));
      for (const doc of referencedDocs) {
        if (!existingNames.has(doc.name)) {
          knowledgeDocs.push(doc);
        }
      }
    } catch (refErr) {
      console.error('[Referenced document resolution error]', refErr);
    }
  }

  if (knowledgeDocs.length > 0) {
    fullPrompt += formatKnowledgeSection(knowledgeDocs);
  }

  const supabase = createServiceRoleClient();
  const history = await loadHistory(conversationId);

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single();

  await storeMessage(conversationId, 'human', userMessage, {
    userId,
    userName: profile?.name ?? 'Unknown',
    channel,
  });

  history.push({ role: 'user', content: userMessage });

  const provider = getProvider(agent.provider);
  const streamResult = await provider.chatStream({
    model: agent.default_model,
    systemPrompt: fullPrompt,
    messages: history,
  });

  let fullResponse = '';

  for await (const chunk of streamResult.stream) {
    if (chunk.type === 'text') {
      fullResponse += chunk.content;
    }
    yield chunk;

    if (chunk.type === 'error') {
      break;
    }
  }

  if (fullResponse) {
    await storeMessage(conversationId, 'agent', fullResponse, {
      model: agent.default_model,
      provider: agent.provider,
      agentName: agent.name,
      knowledgeSources: knowledgeDocs.map((d) => ({
        name: d.name,
        sourceType: d.sourceType,
        status: d.status,
      })),
    });

    try {
      const usage = await streamResult.getUsage();
      await logUsage(agentId, agent.default_model, usage.promptTokens, usage.completionTokens);
    } catch {
      await logUsage(agentId, agent.default_model, 0, 0);
    }
  }
}

/**
 * Non-streaming variant for Slack or other channels that need the full response.
 */
export async function processAgentMessageSync(
  params: PipelineParams,
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of processAgentMessage(params)) {
    if (chunk.type === 'text') {
      fullResponse += chunk.content;
    }
  }
  return fullResponse;
}
