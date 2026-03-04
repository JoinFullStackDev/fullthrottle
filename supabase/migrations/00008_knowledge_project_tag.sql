-- FullThrottle AI — Project-based knowledge scoping
-- Add project_tag to knowledge_sources for project-level document assignment.

ALTER TABLE knowledge_sources ADD COLUMN project_tag TEXT;

CREATE INDEX idx_knowledge_sources_project_tag ON knowledge_sources(project_tag);
