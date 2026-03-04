-- FullThrottle AI — Knowledge Fetching Layer
-- Expand knowledge_sources for external source tracking + create knowledge_content cache.

-- =============================================================================
-- KNOWLEDGE SOURCES: expand for external sources and caching
-- =============================================================================

ALTER TABLE knowledge_sources ADD COLUMN source_type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE knowledge_sources ADD COLUMN external_id TEXT;
ALTER TABLE knowledge_sources ADD COLUMN integration_id UUID REFERENCES integrations(id);
ALTER TABLE knowledge_sources ADD COLUMN agent_id UUID REFERENCES agents(id);
ALTER TABLE knowledge_sources ADD COLUMN folder_tag TEXT;
ALTER TABLE knowledge_sources ADD COLUMN content_hash TEXT;
ALTER TABLE knowledge_sources ADD COLUMN last_fetched_at TIMESTAMPTZ;
ALTER TABLE knowledge_sources ADD COLUMN last_modified_at TIMESTAMPTZ;
ALTER TABLE knowledge_sources ADD COLUMN fetch_status TEXT NOT NULL DEFAULT 'never_fetched';
ALTER TABLE knowledge_sources ADD COLUMN refresh_interval_minutes INTEGER NOT NULL DEFAULT 60;
ALTER TABLE knowledge_sources ADD COLUMN mime_type TEXT;

CREATE INDEX idx_knowledge_sources_agent ON knowledge_sources(agent_id);
CREATE INDEX idx_knowledge_sources_folder_tag ON knowledge_sources(folder_tag);
CREATE INDEX idx_knowledge_sources_source_type ON knowledge_sources(source_type);

-- =============================================================================
-- KNOWLEDGE CONTENT: cached extracted text
-- =============================================================================

CREATE TABLE knowledge_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  char_count  INTEGER NOT NULL DEFAULT 0,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_content_source ON knowledge_content(source_id);

ALTER TABLE knowledge_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_content_select ON knowledge_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY knowledge_content_insert ON knowledge_content
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY knowledge_content_update ON knowledge_content
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY knowledge_content_delete ON knowledge_content
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
