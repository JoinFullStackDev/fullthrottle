# FullThrottle AI

**Architecture Overview (Phase 1 Foundation)**

This document is written for engineers, future contributors, Cursor, and PM. It defines structure, separation of concerns, data boundaries, and future runtime integration without coupling prematurely to OpenClaw.

---

## Table of Contents

1. [Purpose of This Document](#1-purpose-of-this-document)
2. [System Overview](#2-system-overview)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Layer 1 — Control Center](#4-layer-1--control-center)
5. [Application Layer Structure](#5-application-layer-structure)
6. [Layer 2 — Knowledge Layer (FullStack Brain)](#6-layer-2--knowledge-layer-fullstack-brain)
7. [Layer 3 — Agent Runtime Layer (Future)](#7-layer-3--agent-runtime-layer-future)
8. [Domain Model (Conceptual)](#8-domain-model-conceptual)
9. [Permissions & RBAC](#9-permissions--rbac)
10. [Separation of Concerns](#10-separation-of-concerns)
11. [MVP Constraints](#11-mvp-constraints)
12. [Extensibility Design](#12-extensibility-design)
13. [Future Integration Pattern](#13-future-integration-pattern)
14. [Deployment Model (Initial)](#14-deployment-model-initial)
15. [Observability Requirements](#15-observability-requirements)
16. [Security Posture](#16-security-posture)
17. [Performance Guidelines](#17-performance-guidelines)
18. [Design Alignment](#18-design-alignment)
19. [One Sentence Summary](#19-one-sentence-summary)

---

## 1. Purpose of This Document

This document defines the architectural direction for FullThrottle AI.

It establishes:

- System components
- Boundaries between layers
- MVP scope
- Future integration points
- Governance and extensibility constraints

This architecture is designed to:

- Be runtime-agnostic (no tight OpenClaw coupling in Phase 1)
- Be expandable
- Be secure by default
- Support layered persona overrides
- Enable multi-agent orchestration

---

## 2. System Overview

FullThrottle AI consists of three major conceptual layers:

1. Control Center (Application Layer)
2. Knowledge Layer (FullStack Brain)
3. Agent Runtime Layer (Future Integration)

Phase 1 builds Layer 1 and prepares Layer 2.
Layer 3 is deferred.

---

## 3. High-Level Architecture

```
[ User (Internal Team) ]
        |
        v
[ Next.js App Router (Pages + Components) ]
        |
        ├──> [ Supabase Auth ]
        |
        ├──> [ Supabase Postgres (Data + RLS) ]
        |
        ├──> [ Thin Server-Side Endpoints (where needed) ]
        |
        v
[ Knowledge Workspace (Brain) — metadata only ]
        |
        v
[ Agent Runtime Adapter (Future Phase) ]
        |
        v
[ OpenClaw / Slack / External Interfaces (Future) ]
```

Next.js serves as a clean application shell and orchestration layer. Supabase owns authentication, data storage, and access control. Business logic lives in feature-level service wrappers, not in React components or sprawling API routes.

---

## 4. Layer 1 — Control Center

The Control Center is the primary application built in Phase 1.

**It is responsible for:**

- Agent registry management
- Persona metadata
- Persona override configuration
- Task system
- Kanban board
- Conversation log storage (stub)
- Role-based access control
- Audit logging
- Usage event storage (placeholder)

**It is NOT responsible for:**

- Running agents
- Executing shell commands
- Managing model tokens
- Calling external LLM APIs
- Connecting to Slack (in MVP)

---

## 5. Application Layer Structure

The project uses Next.js App Router. The codebase is organized by feature module to keep each domain self-contained. Next.js handles routing and page rendering. Supabase handles auth, data, and access control. Feature-level service wrappers provide the interface between UI and Supabase — no "god" utility layers.

**Recommended internal structure:**

```
src/
  app/                       # Next.js App Router (routes + layouts)
    (auth)/                  # Auth-gated layout group
      dashboard/
      agents/
      tasks/
      conversations/
      admin/
    login/
    layout.tsx               # Root layout (ThemeProvider, Supabase session)
  components/                # Shared UI components
  features/                  # Domain modules (self-contained)
    agents/                  # Agent registry, cards, detail views, service
    personas/                # Persona overrides, editor, versioning, service
    tasks/                   # Task CRUD, Kanban board, service
    conversations/           # Conversation log viewer (stub), service
    usage/                   # Usage metrics (placeholder), service
    audit/                   # Audit log viewer, service
  lib/                       # Supabase client init, shared types, constants
  hooks/                     # Shared custom hooks
  theme/                     # MUI theme configuration
```

**Key Domain Modules:**

- Agents
- PersonaOverrides
- Tasks
- Conversations
- UsageEvents (future)
- Roles & Permissions
- AuditLogs

Each module must be self-contained. Each feature module should have its own service file that wraps Supabase queries for that domain. Avoid cross-module imports of service internals.

---

## 6. Layer 2 — Knowledge Layer (FullStack Brain)

The Brain is not an AI system.

It is a structured, version-controlled documentation repository.

**Structure:**

```
brain/
  index.md
  sow/
  prd/
  architecture/
  qa/
  ops/
  bd/
  decisions/
```

**Phase 1:**

- Metadata only in Control Center
- No dynamic indexing required
- No vector search required
- No embeddings required

**Future:**

- Runtime layer may index Brain content
- Agents may reference allowed domains

---

## 7. Layer 3 — Agent Runtime Layer (Future)

This layer is intentionally abstracted. The full integration contract is defined in `docs/03_RUNTIME_CONTRACT.md`.

**Possible future runtime:**

- OpenClaw Gateway
- Custom agent orchestration layer
- Alternative LLM gateway

**The Control Center must never assume:**

- A specific provider
- A specific API contract
- A specific model
- A specific session format

**Future runtime responsibilities:**

- Maintain persistent agent sessions
- Route Slack messages
- Execute reasoning tasks
- Track token usage
- Perform async task processing

The Control Center will eventually communicate with this layer through a clearly defined `RuntimeAdapter` interface. Phase 1 must define this interface in code (with a stub implementation) and include nullable runtime-seam fields in the database so integration is wiring, not redesign.

---

## 8. Domain Model (Conceptual)

### Agent

- `id`
- `name` (Axel, Riff, Torque, etc.)
- `role`
- `basePersonaVersion`
- `status` (Offline, Active, Disabled, Planned)
- `defaultModel` (metadata only in MVP)
- `runtimeAgentId` (nullable — runtime seam, see `03_RUNTIME_CONTRACT.md`)
- `createdAt` / `updatedAt`

---

### PersonaOverride

- `id`
- `agentId`
- `scopeType` (agent, project, environment, hotfix)
- `scopeId`
- `rules` (array)
- `skills` (array)
- `templates` (object)
- `knowledgeScope` (object)
- `escalationRules` (object)
- `riskTolerance`
- `version`
- `createdBy`
- `approvedBy`
- `createdAt`

---

### Task

- `id`
- `title`
- `description`
- `status` (Backlog, Ready, In Progress, Waiting, Review, Done)
- `ownerType` (Human | Agent)
- `ownerId`
- `priority`
- `projectTag`
- `runtimeRunId` (nullable — runtime seam, see `03_RUNTIME_CONTRACT.md`)
- `lastRuntimeStatus` (nullable — runtime seam)
- `createdBy`
- `createdAt`
- `updatedAt`

---

### Conversation

- `id`
- `agentId`
- `createdBy`
- `createdAt`

---

### ConversationMessage

- `id`
- `conversationId`
- `senderType` (Human | Agent | System)
- `content`
- `metadata`
- `createdAt`

---

### UsageEvent (Future)

- `id`
- `agentId`
- `model`
- `tokenCount`
- `costEstimate`
- `timestamp`

---

### AuditLog

- `id`
- `actorId`
- `actionType`
- `entityType`
- `entityId`
- `beforeState`
- `afterState`
- `timestamp`

---

## 9. Permissions & RBAC

**Roles:**

- Super Admin
- Admin
- Team Lead
- Contributor
- Viewer

**Permissions determine:**

- Who can edit personas
- Who can apply overrides
- Who can assign tasks
- Who can edit tasks
- Who can see usage data
- Who can view audit logs

All persona modifications must be logged.

---

## 10. Separation of Concerns

The architecture must strictly separate:

**Persona ≠ Knowledge ≠ Permissions ≠ Runtime**

### Persona

Defines behavioral rules.

### Knowledge

Defines what documents are allowed.

### Permissions

Defines who can configure what.

### Runtime

Executes tasks and reasoning.

No layer should bleed into another.

---

## 11. MVP Constraints

For Phase 1:

- No external API calls to LLMs.
- No Slack integration.
- No real agent execution.
- No direct filesystem access from Control Center.
- No embedding pipelines.
- No background job system required (unless needed for internal app).

Focus: modeling and orchestration.

---

## 12. Extensibility Design

This system must support:

- Additional agents
- Project-specific agent instances
- Model routing rules
- Multi-environment configurations
- External connectors (Slack, GitLab, etc.)
- Async job processing
- Observability dashboards

Design decisions should anticipate scale without overengineering MVP.

---

## 13. Future Integration Pattern

The full runtime integration contract is defined in `docs/03_RUNTIME_CONTRACT.md`. It specifies data ownership, event flows, persona delivery, security boundaries, and the complete adapter interface.

When integrating runtime later, all operations flow through the **Runtime Adapter Interface**:

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

Control Center must only speak to the adapter. The adapter handles runtime specifics.

Phase 1 must define this interface in code with a **stub implementation** (in `lib/runtime/`) and include nullable runtime-seam DB fields so integration later is wiring, not redesign.

---

## 14. Deployment Model (Initial)

MVP can run as:

- Single Next.js application (App Router)
- Supabase project (Postgres + Auth + optionally RLS)
- Internal-only deployment
- Auth-protected via Supabase Auth

Next.js API routes are used sparingly — only where server-side execution is required (e.g., privileged Supabase service-role operations). The application is not a microservices architecture.

No microservices required.

No distributed orchestration required.

---

## 15. Observability Requirements

**Phase 1:**

- Error logging
- Audit logging
- Basic metrics

**Future:**

- Agent activity monitoring
- Token usage dashboards
- Runtime health checks
- Task throughput metrics

---

## 16. Security Posture

- Internal access only
- No client data ingestion without explicit model
- No production credentials stored
- No direct system shell exposure
- Role-based access enforced
- All persona edits logged

**Supabase as security boundary:**

- All writes must require authenticated users.
- Roles must be stored and validated (e.g., `user_roles` table).
- Sensitive tables should enforce access via RLS policies (preferred as the system matures) or strict server-side role checks (acceptable for internal MVP if consistently enforced).
- No secrets (Supabase service keys, runtime tokens, etc.) may ever be exposed to the browser.
- Privileged operations (service-role queries, admin mutations) must run server-side only (Next.js Route Handlers or Server Actions).

This is an internal operational system.
Security must assume misuse is possible.

---

## 17. Performance Guidelines

- Scope Supabase queries tightly — avoid full-table scans.
- Paginate list views where relevant (tasks, audit logs, conversations).
- Add database indexes on common filters: task status/owner, agent id, timestamps.
- Keep Next.js fast: avoid heavy server work in request/response paths.
- Avoid unnecessary Next.js middleware.
- Limit global providers to the minimum (MUI ThemeProvider, Supabase session).
- Prevent "god" utility layers — use small, feature-level service wrappers around Supabase.
- Keep any future runtime connectors isolated in a dedicated adapter module rather than spread across random routes.

---

## 18. Design Alignment

This architecture aligns with:

- Material UI dark theme control console
- Modular domain features
- Clean separation of runtime
- Structured persona layering
- Auditability

---

## 19. One Sentence Summary

FullThrottle AI is an internal orchestration platform that models and governs structured AI teammates through a decoupled control layer, layered persona system, task engine, and future runtime adapter — without coupling directly to any specific agent provider in Phase 1.

---

*If you'd like next, we can: generate a concrete DB schema (Postgres), generate a Cursor-friendly "Engineering Implementation Plan", break this into GitLab-ready epics and tickets, or stress test this architecture like a skeptical CTO and point out weak spots.*
