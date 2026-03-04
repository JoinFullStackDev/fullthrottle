-- Add avatar_url to agents
ALTER TABLE agents ADD COLUMN avatar_url text;

-- Agent context key-value pairs
CREATE TABLE agent_context (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, key)
);

CREATE TRIGGER agent_context_updated_at
  BEFORE UPDATE ON agent_context
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE agent_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_context_select ON agent_context
  FOR SELECT TO authenticated USING (true);

CREATE POLICY agent_context_insert ON agent_context
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY agent_context_update ON agent_context
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY agent_context_delete ON agent_context
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- Storage policy for agent avatars in the avatars bucket
CREATE POLICY agent_avatars_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'agents'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY agent_avatars_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'agents'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
