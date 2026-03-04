interface PostMessageParams {
  botToken: string;
  channel: string;
  text: string;
  threadTs?: string;
  username?: string;
  iconUrl?: string;
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  ts?: string;
}

/**
 * Posts a message to a Slack channel using the Slack Web API.
 * Uses the native fetch API — no Slack SDK dependency needed.
 */
export async function postSlackMessage(params: PostMessageParams): Promise<SlackApiResponse> {
  const { botToken, channel, text, threadTs, username, iconUrl } = params;

  const body: Record<string, unknown> = {
    channel,
    text,
  };

  if (threadTs) body.thread_ts = threadTs;
  if (username) body.username = username;
  if (iconUrl) body.icon_url = iconUrl;

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data: SlackApiResponse = await res.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? 'unknown'}`);
  }

  return data;
}

/**
 * Updates an existing Slack message.
 */
export async function updateSlackMessage(params: {
  botToken: string;
  channel: string;
  ts: string;
  text: string;
}): Promise<SlackApiResponse> {
  const { botToken, channel, ts, text } = params;

  const res = await fetch('https://slack.com/api/chat.update', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, ts, text }),
  });

  const data: SlackApiResponse = await res.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? 'unknown'}`);
  }

  return data;
}
