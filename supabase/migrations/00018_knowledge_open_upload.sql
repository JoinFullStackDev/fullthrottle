-- FullThrottle AI — Open Knowledge Upload
-- Broaden knowledge_sources INSERT policy so all authenticated users can upload
-- documents, not just admins. DELETE and UPDATE remain admin-only.

DROP POLICY knowledge_sources_insert ON knowledge_sources;
CREATE POLICY knowledge_sources_insert ON knowledge_sources
  FOR INSERT TO authenticated WITH CHECK (true);
