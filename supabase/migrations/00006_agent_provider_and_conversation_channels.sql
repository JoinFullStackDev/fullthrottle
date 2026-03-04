-- FullThrottle AI — Direct LLM Agent Team
-- Add provider column to agents, channel/thread columns to conversations.

-- =============================================================================
-- AGENTS: add provider column
-- =============================================================================

ALTER TABLE agents ADD COLUMN provider TEXT NOT NULL DEFAULT 'anthropic';

-- =============================================================================
-- CONVERSATIONS: add channel + external identifiers + title
-- =============================================================================

ALTER TABLE conversations ADD COLUMN channel TEXT NOT NULL DEFAULT 'web';
ALTER TABLE conversations ADD COLUMN title TEXT;
ALTER TABLE conversations ADD COLUMN external_thread_id TEXT;
ALTER TABLE conversations ADD COLUMN external_channel_id TEXT;

CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_external_thread
  ON conversations(external_thread_id)
  WHERE external_thread_id IS NOT NULL;

-- =============================================================================
-- USAGE EVENTS: allow service-role inserts (server-side pipeline writes usage)
-- =============================================================================

CREATE POLICY usage_events_insert ON usage_events FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- UPDATE SEED DATA: assign providers and models per agent
-- =============================================================================

UPDATE agents SET provider = 'anthropic', default_model = 'claude-sonnet-4-20250514'
  WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE agents SET provider = 'anthropic', default_model = 'claude-3-5-haiku-20241022'
  WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE agents SET provider = 'google', default_model = 'gemini-2.0-flash'
  WHERE id = 'a0000000-0000-0000-0000-000000000003';
