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

  let body: { agentId?: string; conversationId?: string; message?: string; documentIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { agentId, conversationId: existingConvId, message, documentIds } = body;

  if (!agentId || !message?.trim()) {
    return new Response(
      JSON.stringify({ error: 'agentId and message are required' }),
      { status: 400 },
    );
  }

  let conversationId = existingConvId;

  if (!conversationId) {
    const svc = createServiceRoleClient();
    const { data: conv, error: convError } = await svc
      .from('conversations')
      .insert({
        agent_id: agentId,
        created_by: user.id,
        channel: 'web',
        title: message.trim().slice(0, 100),
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
  }

  const encoder = new TextEncoder();
  const finalConvId = conversationId;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversationId: finalConvId })}\n\n`),
        );

        const generator = processAgentMessage({
          agentId: agentId!,
          conversationId: finalConvId,
          userMessage: message!.trim(),
          userId: user.id,
          channel: 'web',
          documentIds,
        });

        for await (const chunk of generator) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
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
