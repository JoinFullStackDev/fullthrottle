import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifySlackSignature } from '@/lib/slack/verify';
import { parseSlackMessage, type SlackEvent } from '@/lib/slack/event-parser';
import { processAgentMessageSync } from '@/lib/runtime/message-pipeline';
import { postSlackMessage } from '@/lib/slack/client';

async function getSlackCredentials(): Promise<{
  signingSecret: string;
  botToken: string;
  agentSlackUserIds: Map<string, string>;
  channelAgentMap: Map<string, string>;
  agentIdMap: Map<string, string>;
} | null> {
  const supabase = createServiceRoleClient();

  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, agent_id, config')
    .eq('type', 'slack');

  if (!integrations?.length) return null;

  const integration = integrations[0];
  const integrationId = integration.id;

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('integration_id', integrationId)
    .single();

  if (!creds) return null;

  const credentials = creds.credentials as Record<string, string>;
  const config = integration.config as Record<string, unknown>;

  const agentSlackUserIds = new Map<string, string>();
  const channelAgentMap = new Map<string, string>();
  const agentIdMap = new Map<string, string>();

  const { data: agents } = await supabase.from('agents').select('id, name');

  for (const int of integrations) {
    const intConfig = int.config as Record<string, unknown>;
    const agentSlackUserId = intConfig.agentSlackUserId as string | undefined;
    const agentId = int.agent_id;

    if (agentId) {
      const agentName = agents?.find((a) => a.id === agentId)?.name;
      if (agentSlackUserId && agentName) {
        agentSlackUserIds.set(agentSlackUserId, agentName);
        agentIdMap.set(agentName.toLowerCase(), agentId);
      }

      const channelMappings = intConfig.channelMappings as
        | Array<{ channelId: string }>
        | undefined;
      if (channelMappings && agentName) {
        for (const mapping of channelMappings) {
          channelAgentMap.set(mapping.channelId, agentName);
        }
      }
    }
  }

  const agentSlackId = config.agentSlackUserId as string | undefined;
  if (agentSlackId && integration.agent_id) {
    const agentName = agents?.find((a) => a.id === integration.agent_id)?.name;
    if (agentName) {
      agentSlackUserIds.set(agentSlackId, agentName);
      agentIdMap.set(agentName.toLowerCase(), integration.agent_id);
    }
  }

  return {
    signingSecret: credentials.signingSecret ?? '',
    botToken: credentials.botToken ?? '',
    agentSlackUserIds,
    channelAgentMap,
    agentIdMap,
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let payload: SlackEvent;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (payload.type === 'url_verification' && payload.challenge) {
    return NextResponse.json({ challenge: payload.challenge });
  }

  const slackConfig = await getSlackCredentials();
  if (!slackConfig) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 503 });
  }

  const timestamp = req.headers.get('x-slack-request-timestamp') ?? '';
  const signature = req.headers.get('x-slack-signature') ?? '';

  if (
    slackConfig.signingSecret &&
    !verifySlackSignature({
      signingSecret: slackConfig.signingSecret,
      timestamp,
      body: rawBody,
      signature,
    })
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (payload.type !== 'event_callback' || !payload.event) {
    return NextResponse.json({ ok: true });
  }

  const parsed = parseSlackMessage(payload, slackConfig.agentSlackUserIds);
  if (!parsed || !parsed.text) {
    return NextResponse.json({ ok: true });
  }

  let agentName = parsed.mentionedAgentName;
  if (!agentName) {
    agentName = slackConfig.channelAgentMap.get(parsed.channelId) ?? null;
  }

  if (!agentName) {
    return NextResponse.json({ ok: true });
  }

  const agentId = slackConfig.agentIdMap.get(agentName.toLowerCase());
  if (!agentId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  let conversationId: string;
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('external_thread_id', parsed.threadTs)
    .eq('channel', 'slack')
    .single();

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        created_by: '00000000-0000-0000-0000-000000000000',
        channel: 'slack',
        title: parsed.text.slice(0, 100),
        external_thread_id: parsed.threadTs,
        external_channel_id: parsed.channelId,
      } as never)
      .select('id')
      .single();

    if (convErr || !newConv) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
    conversationId = (newConv as { id: string }).id;
  }

  try {
    const response = await processAgentMessageSync({
      agentId,
      conversationId,
      userMessage: parsed.text,
      userId: parsed.userId,
      channel: 'slack',
    });

    await postSlackMessage({
      botToken: slackConfig.botToken,
      channel: parsed.channelId,
      text: response,
      threadTs: parsed.threadTs,
      username: agentName,
    });
  } catch (err) {
    console.error('Slack agent response error:', err);
  }

  return NextResponse.json({ ok: true });
}
