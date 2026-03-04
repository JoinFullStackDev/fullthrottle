-- FullThrottle AI — Integrations table for external service connections

CREATE TYPE integration_type AS ENUM ('slack', 'gitlab', 'google_drive');
CREATE TYPE integration_status AS ENUM ('not_configured', 'configured', 'connected', 'error');

CREATE TABLE integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         integration_type NOT NULL,
  agent_id     uuid REFERENCES agents(id) ON DELETE CASCADE,
  status       integration_status NOT NULL DEFAULT 'not_configured',
  config       jsonb NOT NULL DEFAULT '{}',
  credentials  jsonb NOT NULL DEFAULT '{}',
  created_by   uuid NOT NULL REFERENCES profiles(id),
  updated_by   uuid REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_integrations_type_agent
  ON integrations(type, COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'));
CREATE INDEX idx_integrations_agent ON integrations(agent_id);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_select ON integrations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY integrations_insert ON integrations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY integrations_update ON integrations
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY integrations_delete ON integrations
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
