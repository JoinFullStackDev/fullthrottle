-- FullThrottle AI — Seed Data
-- MVP agents, sample knowledge sources.
-- Tasks, overrides, audit logs, and conversations are seeded after a user exists
-- (they require a profile FK). Use the /api/admin/seed endpoint for those.

-- =============================================================================
-- AGENTS (3 MVP agents) — upsert so this migration is re-runnable
-- =============================================================================

INSERT INTO agents (id, name, role, base_persona_version, status, default_model, description, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Axel',   'Engineering', 'v1.0', 'offline', 'gpt-4o', 'The engineering crew chief: he maps the terrain, calls the risks, and lays out the cleanest build plan.', '2025-12-01T00:00:00Z', '2025-12-15T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000002', 'Riff',   'Product',     'v1.0', 'offline', 'gpt-4o', 'Riff turns ambiguity into scope and scope into tickets that engineering and QA can execute without guessing.', '2025-12-01T00:00:00Z', '2025-12-15T00:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003', 'Torque', 'QA',          'v1.0', 'offline', 'gpt-4o', 'Torque applies pressure until the weak points show up — then turns that into a concrete validation plan.', '2025-12-01T00:00:00Z', '2025-12-15T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  base_persona_version = EXCLUDED.base_persona_version,
  default_model = EXCLUDED.default_model;

-- =============================================================================
-- KNOWLEDGE SOURCES — skip duplicates
-- =============================================================================

INSERT INTO knowledge_sources (name, type, path) VALUES
  ('FullThrottle Architecture', 'Architecture', 'brain/architecture/fullthrottle.md'),
  ('FullThrottle SOW',          'SOW',          'brain/sow/fullthrottle-phase1.md'),
  ('QA Standards',              'QA',           'brain/qa/standards.md'),
  ('Product Requirements — Phase 1', 'PRD',    'brain/prd/fullthrottle-phase1.md'),
  ('Operations Playbook',       'Ops',          'brain/ops/playbook.md')
ON CONFLICT DO NOTHING;
