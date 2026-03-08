-- FullThrottle AI — Clutch Intake Support
-- Adds metadata, parent_task_id, and external_ref to tasks for
-- source-agnostic intake (Slack, email, GitLab, manual) and idempotency.
-- Seeds the Clutch operations agent.

-- =============================================================================
-- TASKS: new columns
-- =============================================================================

ALTER TABLE tasks
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  ADD COLUMN external_ref text;

CREATE UNIQUE INDEX idx_tasks_external_ref
  ON tasks(external_ref)
  WHERE external_ref IS NOT NULL;

CREATE INDEX idx_tasks_parent
  ON tasks(parent_task_id)
  WHERE parent_task_id IS NOT NULL;

-- =============================================================================
-- CLUTCH AGENT
-- =============================================================================

INSERT INTO agents (id, name, role, base_persona_version, status, default_model, provider, description, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'Clutch',
  'Operations',
  'v1.0',
  'active',
  '',
  '',
  'The operations bridge: captures Slack requests, resolves docs, creates structured backlog tasks, and delivers completed work back to Slack and GitLab.',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;
