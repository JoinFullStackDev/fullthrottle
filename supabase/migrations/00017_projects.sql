-- FullThrottle AI — Projects Table
-- Managed project registry for consistent tagging across tasks, knowledge sources, and intakes.

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY projects_insert ON projects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
CREATE POLICY projects_update ON projects FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- Seed initial projects
INSERT INTO projects (name, slug, description) VALUES
  ('FullThrottle AI',      'fullthrottle',         'Internal multi-agent operations platform'),
  ('Invessio LMS',         'invessio-lms',         'Learning management system'),
  ('Invessio Marketplace', 'invessio-marketplace', 'Marketplace platform'),
  ('FullStackRX',          'fullstackrx',          'FullStackRX project'),
  ('Ignyte',               'ignyte',               'Ignyte project'),
  ('TestForge',            'testforge',            'Testing and QA platform'),
  ('FSM',                  'fsm',                  'FSM project')
ON CONFLICT (slug) DO NOTHING;
