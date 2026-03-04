-- Fix Riff's model — Claude 3.5 Haiku was retired 2026-02-19.
-- Replaced with Claude Haiku 4.5.

UPDATE agents SET default_model = 'claude-haiku-4-5-20251001'
  WHERE id = 'a0000000-0000-0000-0000-000000000002';
