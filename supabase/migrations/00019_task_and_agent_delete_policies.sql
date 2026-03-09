-- FullThrottle AI — Task & Agent Delete Policies
-- Enable deletion for tasks, agents, and persona_overrides (super_admin / admin only).
-- Fix knowledge_sources.agent_id FK to SET NULL on agent delete.

-- =============================================================================
-- RLS DELETE POLICIES
-- =============================================================================

CREATE POLICY tasks_delete ON tasks
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY agents_delete ON agents
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY persona_overrides_delete ON persona_overrides
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- =============================================================================
-- FIX knowledge_sources.agent_id FK — change NO ACTION to SET NULL
-- =============================================================================

ALTER TABLE knowledge_sources
  DROP CONSTRAINT knowledge_sources_agent_id_fkey;

ALTER TABLE knowledge_sources
  ADD CONSTRAINT knowledge_sources_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
