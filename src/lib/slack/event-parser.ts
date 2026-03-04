export interface SlackEvent {
  type: string;
  event?: {
    type: string;
    text?: string;
    user?: string;
    channel?: string;
    thread_ts?: string;
    ts?: string;
    bot_id?: string;
  };
  challenge?: string;
  event_id?: string;
  team_id?: string;
}

export interface ParsedSlackMessage {
  text: string;
  userId: string;
  channelId: string;
  threadTs: string;
  eventTs: string;
  teamId: string;
  mentionedAgentName: string | null;
}

const MENTION_REGEX = /<@([A-Z0-9]+)>/g;

/**
 * Extracts a clean message from a Slack event, identifying which agent was mentioned.
 */
export function parseSlackMessage(
  event: SlackEvent,
  agentSlackUserIds: Map<string, string>,
): ParsedSlackMessage | null {
  const evt = event.event;
  if (!evt || !evt.text || !evt.user || !evt.channel) return null;

  if (evt.bot_id) return null;

  if (evt.type !== 'app_mention' && evt.type !== 'message') return null;

  let mentionedAgentName: string | null = null;
  let cleanText = evt.text;

  const mentions = [...evt.text.matchAll(MENTION_REGEX)];
  for (const match of mentions) {
    const slackUserId = match[1];
    const agentName = agentSlackUserIds.get(slackUserId);
    if (agentName) {
      mentionedAgentName = agentName;
      cleanText = cleanText.replace(match[0], '').trim();
    }
  }

  return {
    text: cleanText,
    userId: evt.user,
    channelId: evt.channel,
    threadTs: evt.thread_ts ?? evt.ts ?? '',
    eventTs: evt.ts ?? '',
    teamId: event.team_id ?? '',
    mentionedAgentName,
  };
}
