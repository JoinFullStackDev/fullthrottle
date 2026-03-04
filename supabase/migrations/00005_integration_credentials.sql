-- FullThrottle AI — Move credentials to a separate table with strict RLS

CREATE TABLE integration_credentials (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id   uuid NOT NULL UNIQUE REFERENCES integrations(id) ON DELETE CASCADE,
  credentials      jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_credentials_integration ON integration_credentials(integration_id);

CREATE TRIGGER integration_credentials_updated_at
  BEFORE UPDATE ON integration_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migrate existing credential data
INSERT INTO integration_credentials (integration_id, credentials, created_at, updated_at)
SELECT id, credentials, created_at, updated_at
FROM integrations
WHERE credentials IS NOT NULL AND credentials != '{}'::jsonb;

-- Drop the credentials column from integrations
ALTER TABLE integrations DROP COLUMN credentials;

-- Strict RLS: only super_admin and admin can access credentials
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_credentials_select ON integration_credentials
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY integration_credentials_insert ON integration_credentials
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY integration_credentials_update ON integration_credentials
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY integration_credentials_delete ON integration_credentials
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
