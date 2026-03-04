-- FullThrottle AI — Initial Schema
-- Phase D: All domain tables, enums, indexes, triggers, and RLS policies.

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'super_admin', 'admin', 'team_lead', 'contributor', 'viewer'
);

CREATE TYPE agent_status AS ENUM (
  'offline', 'active', 'disabled', 'planned'
);

CREATE TYPE override_scope_type AS ENUM (
  'agent', 'project', 'environment', 'hotfix'
);

CREATE TYPE risk_tolerance AS ENUM (
  'conservative', 'balanced', 'aggressive'
);

CREATE TYPE task_status AS ENUM (
  'backlog', 'ready', 'in_progress', 'waiting', 'review', 'done'
);

CREATE TYPE task_priority AS ENUM (
  'low', 'medium', 'high', 'critical'
);

CREATE TYPE owner_type AS ENUM (
  'human', 'agent'
);

CREATE TYPE sender_type AS ENUM (
  'human', 'agent', 'system'
);

-- =============================================================================
-- PROFILES (extends auth.users)
-- =============================================================================

CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'viewer',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create a profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'viewer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- AGENTS
-- =============================================================================

CREATE TABLE agents (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  role                 text NOT NULL,
  base_persona_version text NOT NULL DEFAULT 'v1.0',
  status               agent_status NOT NULL DEFAULT 'offline',
  default_model        text NOT NULL DEFAULT '',
  runtime_agent_id     text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- PERSONA OVERRIDES
-- =============================================================================

CREATE TABLE persona_overrides (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  scope_type       override_scope_type NOT NULL,
  scope_id         text NOT NULL,
  rules            jsonb NOT NULL DEFAULT '[]',
  skills           jsonb NOT NULL DEFAULT '[]',
  templates        jsonb NOT NULL DEFAULT '{}',
  knowledge_scope  jsonb NOT NULL DEFAULT '{}',
  escalation_rules jsonb NOT NULL DEFAULT '{}',
  risk_tolerance   risk_tolerance NOT NULL DEFAULT 'conservative',
  version          text NOT NULL DEFAULT 'v1.0',
  created_by       uuid NOT NULL REFERENCES profiles(id),
  approved_by      uuid REFERENCES profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_persona_overrides_agent_scope ON persona_overrides(agent_id, scope_type);

-- =============================================================================
-- TASKS
-- =============================================================================

CREATE TABLE tasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  description          text NOT NULL DEFAULT '',
  status               task_status NOT NULL DEFAULT 'backlog',
  owner_type           owner_type NOT NULL DEFAULT 'human',
  owner_id             text NOT NULL,
  priority             task_priority NOT NULL DEFAULT 'medium',
  project_tag          text NOT NULL DEFAULT '',
  runtime_run_id       text,
  last_runtime_status  text,
  created_by           uuid NOT NULL REFERENCES profiles(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_status_owner ON tasks(status, owner_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================

CREATE TABLE conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_agent ON conversations(agent_id);

-- =============================================================================
-- CONVERSATION MESSAGES
-- =============================================================================

CREATE TABLE conversation_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type     sender_type NOT NULL,
  content         text NOT NULL DEFAULT '',
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_messages_conv ON conversation_messages(conversation_id);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid NOT NULL REFERENCES profiles(id),
  action_type  text NOT NULL,
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  before_state jsonb,
  after_state  jsonb,
  reason       text NOT NULL,
  timestamp    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =============================================================================
-- USAGE EVENTS (placeholder)
-- =============================================================================

CREATE TABLE usage_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  model         text NOT NULL DEFAULT '',
  token_count   integer NOT NULL DEFAULT 0,
  cost_estimate numeric(10,6) NOT NULL DEFAULT 0,
  timestamp     timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- KNOWLEDGE SOURCES
-- =============================================================================

CREATE TABLE knowledge_sources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL,
  path       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- UPDATED_AT TRIGGER (auto-update updated_at columns)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Agents: all authenticated users can read; only admin+ can mutate
CREATE POLICY agents_select ON agents FOR SELECT TO authenticated USING (true);
CREATE POLICY agents_insert ON agents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
CREATE POLICY agents_update ON agents FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- Persona overrides: all authenticated can read; admin+ can insert/update
CREATE POLICY persona_overrides_select ON persona_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY persona_overrides_insert ON persona_overrides FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'team_lead')
  ));
CREATE POLICY persona_overrides_update ON persona_overrides FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- Tasks: all authenticated can read; contributor+ can create/update
CREATE POLICY tasks_select ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY tasks_insert ON tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'team_lead', 'contributor')
  ));
CREATE POLICY tasks_update ON tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'team_lead', 'contributor')
  ));

-- Conversations + messages: all authenticated can read/write
CREATE POLICY conversations_select ON conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY conversations_insert ON conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY conversation_messages_select ON conversation_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY conversation_messages_insert ON conversation_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Audit logs: all authenticated can read; insert only (no updates/deletes)
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Usage events: all authenticated can read
CREATE POLICY usage_events_select ON usage_events FOR SELECT TO authenticated USING (true);

-- Knowledge sources: all authenticated can read; admin+ can mutate
CREATE POLICY knowledge_sources_select ON knowledge_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY knowledge_sources_insert ON knowledge_sources FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
CREATE POLICY knowledge_sources_update ON knowledge_sources FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
CREATE POLICY knowledge_sources_delete ON knowledge_sources FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
