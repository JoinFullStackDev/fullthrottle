# OpenClaw Integration Roadmap

**FullThrottle AI — Control Center + Runtime Integration**

This roadmap covers the full path from pre-arrival preparations through production runtime activation. Each phase builds on the previous one.

---

## Phase 0: Pre-Arrival Preparations (Before Mac Mini)

Everything that does not require the Mac Mini.

### 0.1 Documentation

- Finalize `docs/01_DESIGN_GUIDE.md`
- Finalize `docs/02_ARCHITECTURE.md`
- Finalize `docs/00_OVERVIEW.md`
- Finalize `docs/03_RUNTIME_CONTRACT.md`

### 0.2 Control Center Scaffold

- Next.js App Router project with feature modules: agents, tasks, personas, audit, conversations
- Placeholder UI pages (dashboard, Kanban)

### 0.3 Supabase Setup

- Provision Supabase project
- Secure API keys in environment variables
- Initial schema: agents, tasks, conversations, persona_overrides, audit_logs
- RBAC roles: Super Admin, Admin, Team Lead, Contributor, Viewer

### 0.4 Persona Docs

- Agent persona files (Axel, Riff, Torque)
- Global agent guidelines
- Persona override model documentation

---

## Phase 1: Control Center Baseline (MVP)

Build the control panel before any runtime is attached.

### 1.1 UI

- Dark theme MUI application
- Persistent left sidebar navigation
- Agents list and detail pages
- Persona override editor
- Tasks board (Kanban with drag-and-drop)
- Conversation log placeholder
- Admin page (audit logs, usage placeholder, knowledge sources, users)

### 1.2 Data Models (Supabase)

- agents
- persona_overrides
- tasks
- conversations + conversation_messages
- audit_logs
- profiles (user_roles)
- knowledge_sources
- usage_events (schema placeholder)

### 1.3 RBAC Enforcement

- Role table with RLS policies
- UI gating based on roles
- Admin-only areas for persona overrides and user management

### 1.4 Audit Logging

- Audit entries for all persona edits, agent changes, task mutations
- Captures: who, what, when, before/after state, reason

### 1.5 Runtime Seam Fields

- `agent.runtime_agent_id` (nullable)
- `task.runtime_run_id` (nullable)
- `task.last_runtime_status` (nullable)
- UI placeholders for runtime status and usage metrics

### 1.6 Runtime Adapter Stub

- `RuntimeAdapter` TypeScript interface defined in `lib/runtime/`
- Stub adapter returning placeholder data
- No real runtime calls

**Phase 1 exit criteria:** Control Center is functional with CRUD, persona overrides are editable, Kanban works, audit trail is active. No runtime required.

---

## Phase 2: Runtime Adapter Interfaces

Define the adapter layer so Control Center can talk to any runtime.

### 2.1 Adapter Interface Contract

```typescript
interface RuntimeAdapter {
  getAgentStatus(agentId: string): Promise<AgentRuntimeStatus>;
  listAgentsStatus(): Promise<AgentRuntimeStatus[]>;
  listConversations(agentId: string, since?: string): Promise<ConversationSummary[]>;
  getConversation(conversationId: string): Promise<ConversationDetail>;
  sendMessage(agentId: string, message: string, context?: MessageContext): Promise<SendMessageResult>;
  dispatchTask(agentId: string, task: RuntimeTaskPayload): Promise<DispatchResult>;
  getTaskRunStatus(runId: string): Promise<TaskRunStatus>;
  cancelTaskRun(runId: string): Promise<CancelResult>;
  listUsage(agentId: string, range: DateRange): Promise<UsageEvent[]>;
  getUsageSummary(range: DateRange): Promise<UsageSummary>;
  getRuntimeHealth(): Promise<RuntimeHealth>;
}
```

### 2.2 API Routes

- `/api/runtime/status` — agent status
- `/api/runtime/dispatch` — task dispatch
- `/api/runtime/conversations` — conversation sync
- `/api/runtime/usage` — usage data

Each route calls the adapter (stub initially, real later).

### 2.3 UI Integration

- Agent detail page shows runtime status
- Task page has dispatch buttons (disabled until runtime connected)
- Usage page shows placeholder charts

**Phase 2 exit criteria:** Adapter interface is defined, stub works, UI is wired. No real runtime yet.

---

## Phase 3: Mac Mini Environment and Gateway Setup

Prepare the runtime environment on the Mac Mini.

### 3.1 OS Setup

- Dedicated system user (no personal accounts)
- Install: zsh, Git, Docker (optional), SSH server
- Firewall rules (UFW/ipfw)
- Time sync and backups

### 3.2 Gateway Installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
openclaw gateway status
```

### 3.3 Workspace Structure

- `/opt/fullthrottle/agents/` — workspace folders per agent
- Owned by dedicated runtime user

### 3.4 Security

- Gateway port restricted to internal app host only
- SSH tunnel if exposing beyond local network
- Gateway never exposed publicly

### 3.5 Git / Brain Integration

- Pull brain/ knowledge folder for agents to read
- Read-only access, scoped per agent

---

## Phase 4: OpenClaw Runtime Integration

Connect Control Center to OpenClaw gateway.

### 4.1 Real Adapter Implementation

Replace stub adapter with OpenClaw-backed implementation:
- `getAgentStatus()` — poll gateway
- `dispatchTask()` — submit job to gateway
- `getConversation()` — fetch message logs
- `listUsage()` — pull token/cost events

### 4.2 Data Mapping

- Control Center `agentId` maps to OpenClaw agent workspace
- `taskPayload` maps to OpenClaw job instruction
- Runtime outputs captured and synced back to tasks table

### 4.3 Authentication

- Control Center authenticates to gateway (API key or mTLS)
- Gateway only accepts calls from the app host

### 4.4 Conversation Sync

- Runtime sends conversation messages
- Control Center persists in `conversation_messages`

### 4.5 Usage Sync

- Gateway reports token usage
- Control Center stores in `usage_events`
- Historical charts populated

### 4.6 Health and Heartbeats

- Periodic polling or subscription
- Agent health stored in `agents.last_runtime_status`

---

## Phase 5: Slack Integration

Connect Slack to the agent ecosystem.

### 5.1 Slack App Setup

- Create Slack App with scopes: `chat:write`, `app_mentions:read`, `channels:read`, `users:read`, `message.read`, `events`

### 5.2 Message Routing

- Incoming Slack messages hit Control Center webhook
- Router identifies agent by @mention
- Dispatches to `runtimeAdapter.sendMessage()`

### 5.3 Multi-Agent Routing

- Map channel/mention to agent
- Extract `@AgentName` from messages
- Route to correct agent

### 5.4 Conversation Logging

- Store Slack messages as `conversation_messages` with metadata (user, timestamp, channel)

---

## Phase 6: Operational Visibility

Full observability across the system.

### 6.1 Usage Dashboard

- Token usage per time range
- Cost estimates
- Per-agent usage breakdown

### 6.2 Alerts

- Usage threshold alerts
- Runtime error alerts
- Agent offline detection

### 6.3 Audit Dashboards

- Persona override change history
- Task dispatch events
- Runtime interaction logs

---

## Security and Compliance (Ongoing)

### Production Hardening

- Gateway behind private network
- TLS for adapter endpoints
- Audit logs for all privileged actions

### Secrets Management

- No runtime secrets in frontend code
- Environment variables only
- Key rotation policy

### RBAC Validation

- Only Admins modify personas
- Only authorized roles dispatch tasks
- All actions auditable

---

## Milestone Checklist

| Milestone | Status |
|-----------|--------|
| Phase 0 (Pre-Arrival Prep) | Done |
| Phase 1 (Control Center MVP) | Done |
| Phase 2 (Adapter Stubs) | Done |
| Phase 3 (Mac Mini Setup) | Pending |
| Phase 4 (OpenClaw Integration) | Pending |
| Phase 5 (Slack Integration) | Pending |
| Phase 6 (Ops Dashboard) | Pending |
| Security Hardening | Ongoing |

---

## Prerequisites

- Supabase project provisioned
- Next.js scaffold ready
- RBAC defined
- Brain documentation curated
- Mac Mini accessible (Phase 3+)
- Internal networking configured (Phase 3+)
