# FullThrottle AI

**Runtime Integration Contract — Control Center ↔ Agent Runtime (Future-Proofing Spec)**

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Core Principle: Runtime-Agnostic Control Center](#2-core-principle-runtime-agnostic-control-center)
3. [Integration Model](#3-integration-model)
4. [Adapter Interface Requirements](#4-adapter-interface-requirements)
5. [Event Flow Requirements](#5-event-flow-requirements)
6. [Persona and Override Delivery Model](#6-persona-and-override-delivery-model)
7. [Knowledge "Brain" Integration](#7-knowledge-brain-integration)
8. [Security Boundaries (Non-Negotiable)](#8-security-boundaries-non-negotiable)
9. [MVP Build Requirements (Before Runtime Exists)](#9-mvp-build-requirements-before-runtime-exists)
10. [Anti-Patterns to Avoid](#10-anti-patterns-to-avoid)
11. [One-Sentence Summary](#11-one-sentence-summary)

---

## 1. Purpose

This document defines the future integration boundary between:

- **Control Center** — UI + internal orchestration + governance
- **Agent Runtime** — OpenClaw Gateway + Slack connector + execution environment

Phase 1 explicitly does not implement OpenClaw or Slack integration. Phase 1 must, however, be architected so that runtime integration later is a clean "plug in," not a rebuild.

This contract defines:

- Required adapter interfaces
- Event flows
- Data ownership boundaries
- Security boundaries
- How tasks, conversations, and usage will sync

---

## 2. Core Principle: Runtime-Agnostic Control Center

The Control Center must not depend on OpenClaw-specific concepts directly.

All runtime operations must flow through an abstraction: the **Runtime Adapter Interface**.

This enables:

- OpenClaw integration later
- Swapping runtimes if needed
- Local simulation during development

**Control Center owns:**

- Configuration
- Governance
- Tasks (source of truth)
- Audit logging

**Runtime owns:**

- Execution
- Session management
- Tool usage
- Token spend reporting

---

## 3. Integration Model

### 3.1 Control Center is the "System of Record" for:

- Agents (registry + metadata)
- Persona Overrides (rules / skills / templates)
- Tasks and task status
- Audit logs
- Projects (if used)
- Roles and permissions

### 3.2 Runtime is the "System of Record" for:

- Agent session locks / memory mechanisms
- Actual tool execution (bash / browser)
- "Run logs" from task execution
- Provider/model-level token/cost events (raw)

### 3.3 Shared / Synced Data

- **Conversation threads/messages** — synced into Control Center for visibility
- **Usage summaries** — stored in Control Center for reporting, sourced from runtime
- **Agent health/status** — pulled or pushed

---

## 4. Adapter Interface Requirements

The Control Center will eventually call a runtime adapter. For Phase 1, implement a **stub adapter** that returns placeholder data and validates integration assumptions.

### 4.1 Runtime Adapter Interface (Core)

```typescript
interface RuntimeAdapter {
  // Agent lifecycle / status
  getAgentStatus(agentId: string): Promise<AgentRuntimeStatus>;
  listAgentsStatus(): Promise<AgentRuntimeStatus[]>;

  // Conversations
  listConversations(agentId: string, since?: string): Promise<ConversationSummary[]>;
  getConversation(conversationId: string): Promise<ConversationDetail>;
  sendMessage(agentId: string, message: string, context?: MessageContext): Promise<SendMessageResult>;

  // Tasks
  dispatchTask(agentId: string, task: RuntimeTaskPayload): Promise<DispatchResult>;
  getTaskRunStatus(runId: string): Promise<TaskRunStatus>;
  cancelTaskRun(runId: string): Promise<CancelResult>;

  // Usage / cost
  listUsage(agentId: string, range: DateRange): Promise<UsageEvent[]>;
  getUsageSummary(range: DateRange): Promise<UsageSummary>;

  // Health
  getRuntimeHealth(): Promise<RuntimeHealth>;
}
```

### 4.2 Data Types (Conceptual)

- **AgentRuntimeStatus** — `online` / `idle` / `busy` / `error` + `lastHeartbeat` + `currentRunId`
- **RuntimeTaskPayload** — `taskId` + `title` + `instructions` + `constraints` + `references`
- **TaskRunStatus** — `queued` / `running` / `completed` / `failed` + `logs` + `timestamps`
- **UsageEvent** — `agentId` + `model` + `tokens` + `cost` + `timestamp`
- **RuntimeHealth** — `gatewayVersion` + `uptime` + `errorRates`

The exact implementation can evolve, but the Control Center must code against these shapes, not OpenClaw internals.

---

## 5. Event Flow Requirements

### 5.1 Task Dispatch Flow (Future)

1. Human creates/approves task in Control Center
2. Task assigned to an Agent (Axel / Riff / Torque ...)
3. Control Center calls `dispatchTask(agentId, payload)`
4. Runtime returns `runId`
5. Control Center stores `runId` on the task
6. Runtime emits run status updates (poll or webhook)
7. Control Center updates task state + stores run logs
8. Human reviews outputs
9. Task moves to Review/Done with human approval

**Key requirement:** Tasks remain the source of truth in Control Center. Runtime runs are execution artifacts.

### 5.2 Conversation Sync Flow (Future)

Slack messages will create/append:

- Control Center `Conversation` records
- Control Center `ConversationMessage` records

The runtime may also store its own message logs, but Control Center must have a readable history for governance and debugging.

### 5.3 Usage Sync Flow (Future)

Runtime emits usage events. Control Center stores:

- Usage events (raw or normalized)
- Usage summaries for dashboards

Control Center should not attempt to compute cost without runtime data unless explicitly configured.

---

## 6. Persona and Override Delivery Model

Control Center is the source of truth for persona overrides.

Future integration requires a method to deliver persona changes to runtime.

### Pattern A: Pull Model

Runtime pulls persona config at startup and on interval:

- `GET /api/runtime/persona-config?agentId=...`
- Cached with version check

### Pattern B: Push Model

Control Center pushes updates to runtime when persona changes:

- `POST /runtime/persona-config`
- Includes version + diff

**MVP recommendation:** Pull model (simpler, fewer failure modes).

**Critical requirement:** Persona overrides must be versioned and deterministic.

---

## 7. Knowledge "Brain" Integration

The Brain is the shared knowledge workspace.

**Phase 1:**

- Brain exists as structured repo folder
- Control Center stores metadata pointers only (in Supabase Postgres)

**Future:**

Runtime needs a way to access the Brain safely:

- Mounted folder
- Synced folder (Dropbox-like)
- Read-only volume
- Controlled API for retrieval

**Hard requirement:** Runtime must not have broad access to private file systems by default. Brain scope must be explicit and limited.

---

## 8. Security Boundaries (Non-Negotiable)

1. **No secrets in client-side code.** Supabase service keys, runtime credentials, and tokens must never be exposed to the browser.
2. **Runtime credentials are stored server-side only.** All runtime adapter calls must execute from Next.js server-side code (Route Handlers or Server Actions), never from client components.
3. **Control Center must authenticate runtime calls** (mutual secret or mTLS later).
4. **All runtime actions must be auditable:**
   - Who initiated
   - What agent
   - What task/run
   - What output
5. **Runtime tools (bash / browser) must be disabled by default** and enabled only per agent via explicit permissions (Phase 2+).

---

## 9. MVP Build Requirements (Before Runtime Exists)

Even without runtime integration, Phase 1 must include:

- **`RuntimeAdapter` interface defined in code** (stub implementation in `lib/runtime/`)
- **Database fields for runtime seams** (nullable, in Supabase Postgres):
  - `agent.runtime_agent_id` (nullable)
  - `task.runtime_run_id` (nullable)
  - `task.last_runtime_status` (nullable)
- **UI placeholders for:**
  - Agent status (shows "Offline" for now)
  - Usage dashboard (shows "No data" for now)
- **Task model supports execution artifacts:**
  - Run logs / outputs attached to task

This ensures runtime integration becomes wiring, not redesign.

---

## 10. Anti-Patterns to Avoid

Do not:

- Bake OpenClaw concepts directly into database schema
- Store runtime session data as a primary Control Center dependency
- Assume Slack message format as the canonical conversation model
- Mix runtime execution logic into UI components
- Make tasks depend on runtime completion to exist

**Control Center must always work with runtime "disconnected."**

---

## 11. One-Sentence Summary

Build Control Center as the system-of-record with a strict Runtime Adapter boundary so OpenClaw/Slack integration later is a plug-in rather than a rewrite.
