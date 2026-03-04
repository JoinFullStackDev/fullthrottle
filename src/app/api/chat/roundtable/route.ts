import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { processAgentMessage } from '@/lib/runtime/message-pipeline';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: { agentIds?: string[]; conversationId?: string; message?: string; documentIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { agentIds, conversationId: existingConvId, message, documentIds } = body;

  if (!agentIds || agentIds.length < 2 || !message?.trim()) {
    return new Response(
      JSON.stringify({ error: 'agentIds (min 2) and message are required' }),
      { status: 400 },
    );
  }

  const svc = createServiceRoleClient();

  const { data: agentRows, error: agentError } = await svc
    .from('agents')
    .select('id, name')
    .in('id', agentIds);

  if (agentError || !agentRows || agentRows.length === 0) {
    return new Response(
      JSON.stringify({ error: 'One or more agents not found' }),
      { status: 400 },
    );
  }

  const agentMap = new Map(agentRows.map((a) => [a.id, a.name]));

  let conversationId = existingConvId;

  if (!conversationId) {
    const agentNamesList = agentIds
      .map((id) => agentMap.get(id) ?? 'Agent')
      .join(', ');

    const { data: conv, error: convError } = await svc
      .from('conversations')
      .insert({
        agent_id: agentIds[0],
        created_by: user.id,
        channel: 'web',
        title: `Round Table: ${agentNamesList}`,
      } as never)
      .select('id')
      .single();

    if (convError || !conv) {
      return new Response(
        JSON.stringify({ error: convError?.message ?? 'Failed to create conversation' }),
        { status: 500 },
      );
    }
    conversationId = (conv as { id: string }).id;

    for (const agentId of agentIds) {
      await svc.from('conversation_agents').insert({
        conversation_id: conversationId,
        agent_id: agentId,
      } as never);
    }
  }

  const encoder = new TextEncoder();
  const finalConvId = conversationId;
  const trimmedMessage = message!.trim();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'meta', conversationId: finalConvId })}\n\n`,
          ),
        );

        for (const agentId of agentIds) {
          const agentName = agentMap.get(agentId) ?? 'Agent';

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'agentStart', agentId, agentName })}\n\n`,
            ),
          );

          const generator = processAgentMessage({
            agentId,
            conversationId: finalConvId,
            userMessage: trimmedMessage,
            userId: user.id,
            channel: 'web',
            documentIds,
          });

          for await (const chunk of generator) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'agentDone', agentId, agentName })}\n\n`,
            ),
          );
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Stream error';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', content: errMsg })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
