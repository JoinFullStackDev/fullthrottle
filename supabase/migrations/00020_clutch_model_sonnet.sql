-- Migration: 00020_clutch_model_sonnet
-- Set Clutch's default model to claude-sonnet-4-20250514.
-- Clutch was previously running on claude-opus-4-20250514 (set manually in the DB).
-- Sonnet is the correct model for Clutch — faster, cheaper, and sufficient for
-- intake/routing work. Opus is overkill and contributes to rate limit pressure.

UPDATE agents
SET
  default_model    = 'claude-sonnet-4-20250514',
  base_persona_version = 'v2.1'
WHERE id = 'a0000000-0000-0000-0000-000000000004';  -- Clutch
