-- Migration: 00021_slack_event_dedup
-- Purpose: Track processed Slack event IDs to prevent duplicate LLM calls
--          caused by Slack retrying events that don't receive a 200 within 3 seconds.

create table if not exists slack_processed_events (
  event_id   text        not null primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Index for fast expiry cleanup
create index if not exists idx_slack_processed_events_expires_at
  on slack_processed_events (expires_at);

-- RLS: service role only — this table is internal infrastructure
alter table slack_processed_events enable row level security;

-- Cleanup function to prune expired rows (call from a Supabase cron job or pg_cron)
create or replace function cleanup_slack_processed_events()
returns void
language sql
security definer
as $$
  delete from slack_processed_events where expires_at < now();
$$;
