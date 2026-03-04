-- FullThrottle AI — Add description column to agents
ALTER TABLE agents ADD COLUMN description text NOT NULL DEFAULT '';
