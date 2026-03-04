-- Junction table for multi-agent conversations
CREATE TABLE conversation_agents (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  added_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, agent_id)
);

-- Backfill existing single-agent conversations
INSERT INTO conversation_agents (conversation_id, agent_id)
SELECT id, agent_id FROM conversations WHERE agent_id IS NOT NULL;

-- Allow multi-agent conversations to have no single owner
ALTER TABLE conversations ALTER COLUMN agent_id DROP NOT NULL;

-- RLS policies matching the conversations table pattern
ALTER TABLE conversation_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_agents_select
  ON conversation_agents FOR SELECT TO authenticated USING (true);

CREATE POLICY conversation_agents_insert
  ON conversation_agents FOR INSERT TO authenticated WITH CHECK (true);
