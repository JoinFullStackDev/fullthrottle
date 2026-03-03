# FullThrottle AI — Implementation Plan

**Purpose:** This document is the working reference for building FullThrottle AI. It synthesizes all specifications from the docs folder into a single actionable plan. Every decision, constraint, and deliverable traces back to the source documents.

---

## Table of Contents

1. [What We Are Building](#1-what-we-are-building)
2. [What We Are NOT Building](#2-what-we-are-not-building)
3. [System Architecture (Phase 1)](#3-system-architecture-phase-1)
4. [Tech Stack](#4-tech-stack)
5. [Application Structure](#5-application-structure)
6. [Domain Model](#6-domain-model)
7. [Agent Registry & Personas](#7-agent-registry--personas)
8. [Task System & Kanban](#8-task-system--kanban)
9. [RBAC & Governance](#9-rbac--governance)
10. [Design System Rules](#10-design-system-rules)
11. [Component Architecture](#11-component-architecture)
12. [Phase 1 Deliverables (Ordered)](#12-phase-1-deliverables-ordered)
13. [Phase 1 Boundaries (Hard Stops)](#13-phase-1-boundaries-hard-stops)
14. [Security & Performance Guidelines](#14-security--performance-guidelines)
15. [Future Integration Surface](#15-future-integration-surface)
16. [Success Criteria](#16-success-criteria)
17. [Source Document Index](#17-source-document-index)

---

## 1. What We Are Building

FullThrottle AI is an **internal multi-agent operations platform** for FullStack, built with **Next.js (App Router) + TypeScript + Material UI** for the UI and **Supabase** for Postgres, authentication, and access control.

It provides:

- A **Control Center** web application for managing AI agent personas, tasks, and knowledge
- A structured **Agent Registry** with three MVP agents (Axel, Riff, Torque)
- A **Task System** with Kanban visualization where tasks can be assigned to humans or agents
- A **Persona Override System** with layered configuration, versioning, and audit logging
- **Role-based access control** governing who can configure what
- A **Knowledge Workspace** model (metadata only in Phase 1) called the FullStack Brain
- Placeholder stubs for conversation logging and usage tracking

This is internal infrastructure. Not a chatbot. Not consumer-facing. Not client-facing.

Agents are **advisory-first** and **task-enabled**. Humans remain accountable for all decisions.

---

## 2. What We Are NOT Building

These are explicit exclusions for Phase 1. Do not implement any of the following:

- Shell execution or browser automation
- Slack integration
- Direct LLM/OpenAI/OpenClaw API calls
- Token tracking or cost estimation logic
- Autonomous task execution by agents
- Embedding pipelines or vector search
- Client-facing features of any kind
- Microservices or distributed architecture
- Background job processing (unless required by the app itself)

Phase 1 is **modeling + orchestration scaffolding only**.

---

## 3. System Architecture (Phase 1)

```
[ Internal User ]
       |
       v
[ Next.js App Router (Pages + Components) ]   <-- Phase 1 focus
       |
       ├──> [ Supabase Auth ]                  <-- Phase 1 focus
       |
       ├──> [ Supabase Postgres (Data + RLS) ] <-- Phase 1 focus
       |
       ├──> [ Thin Server-Side Endpoints ]     <-- Only where needed
       |
       v
[ Knowledge Workspace (Brain) ]                <-- Metadata only in Phase 1
       |
       v
[ Agent Runtime Adapter ]                      <-- Interface defined, not implemented
       |
       v
[ OpenClaw / Slack / External Interfaces ]     <-- Future phases
```

Next.js serves as a clean application shell and orchestration layer — pages, components, and thin server-side endpoints only where needed. Supabase owns the backend primitives: authentication, data storage, and access control. Business logic lives in feature-level service wrappers around Supabase, not in React components or sprawling API routes.

### Key architectural constraints:

- **Runtime-agnostic.** The Control Center must never assume a specific agent provider, API contract, model, or session format.
- **Decoupled layers.** Persona ≠ Knowledge ≠ Permissions ≠ Runtime. No layer bleeds into another.
- **Thin application shell.** Next.js handles pages, components, and minimal server-side endpoints. Supabase owns auth, data, and access control. Avoid turning Next into a large "backend-in-a-frontend."
- **Security-first.** Supabase is the security boundary. No secrets (service keys, runtime tokens) exposed to the browser. Privileged operations run server-side only. All writes require authenticated users.
- **Observable.** All persona edits logged. Usage and activity measurable.
- **Expandable.** Must support additional agents, project-specific instances, model routing, multi-environment configs, and external connectors in future phases.

### Deployment model (Phase 1):

- Single Next.js application (App Router)
- Single Supabase project (Postgres + Auth + optionally RLS)
- Internal-only, auth-protected via Supabase Auth
- No microservices, no distributed orchestration

---

## 4. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Application Framework | **Next.js (App Router)** + **TypeScript** | Clean shell — pages, components, thin server-side endpoints only |
| Component Library | **MUI v5+** | Sole UI library. No Tailwind. No mixed kits. |
| State Management | React Context / Zustand (keep simple) | Avoid heavy global state for MVP |
| Backend / Database | **Supabase** (Postgres + Auth + optionally RLS) | Supabase owns auth, data, and access control |
| Data Access | **Supabase JS client** + feature-level service wrappers | No ORM layer — use Supabase client directly with typed queries |
| Auth | **Supabase Auth** | Internal-only, role-based via `user_roles` |
| Deployment | TBD | Internal, auth-protected |

### Stack philosophy:

- Next.js is the **application shell** — routing, layout, minimal server-side endpoints.
- Supabase is the **backend** — auth, Postgres, access control.
- Business logic lives in **feature-level service wrappers** (e.g., `features/agents/service.ts`), not in React components or API routes.
- Minimize API routes. Use them only where server-side execution is required (privileged Supabase service-role operations).
- No "god" utility layers. Each feature module wraps its own Supabase queries.
- Future runtime connectors go in a dedicated adapter module, isolated from application routes.

---

## 5. Application Structure

The project uses Next.js App Router. The codebase is organized by feature module. Next.js handles routing and page rendering. Supabase handles auth, data, and access control. Feature-level service wrappers provide the interface between UI and Supabase.

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
    agents/                  # Agent registry, cards, detail views, service.ts
    personas/                # Persona overrides, editor, versioning, service.ts
    tasks/                   # Task CRUD, Kanban board, service.ts
    conversations/           # Conversation log viewer (stub), service.ts
    usage/                   # Usage metrics (placeholder), service.ts
    audit/                   # Audit log viewer, service.ts
  lib/                       # Supabase client init, shared types, constants
  hooks/                     # Shared custom hooks
  theme/                     # MUI theme configuration
```

Each feature module must be **self-contained** with its own components, hooks, types, and a `service.ts` that wraps Supabase queries for that domain. Avoid cross-module imports of service internals. No "god" utility layers.

---

## 6. Domain Model

These are the core entities. Field definitions come from `02_ARCHITECTURE.md` Section 8.

### Agent

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | Axel, Riff, Torque, etc. |
| role | string | Engineering, Product, QA, etc. |
| basePersonaVersion | string | e.g. "v1.0" |
| status | enum | Offline, Active, Disabled, Planned |
| defaultModel | string | Metadata only in MVP |
| runtimeAgentId | string (nullable) | Runtime seam — maps to external runtime identity (see `03_RUNTIME_CONTRACT.md`) |
| createdAt | timestamp | — |
| updatedAt | timestamp | — |

### PersonaOverride

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| agentId | uuid | FK → Agent |
| scopeType | enum | agent, project, environment, hotfix |
| scopeId | string | Project ID, environment name, etc. |
| rules | json array | Do/Don't constraints, individually toggleable |
| skills | json array | Capabilities, individually toggleable |
| templates | json object | Output format templates |
| knowledgeScope | json object | Allowed folders, projects, restrictions |
| escalationRules | json object | Thresholds and conditions |
| riskTolerance | enum | conservative, balanced, aggressive |
| version | string | Persona version number |
| createdBy | uuid | FK → User |
| approvedBy | uuid | FK → User (nullable) |
| createdAt | timestamp | — |

**Override Precedence** (highest to lowest):

1. Emergency Hotfix Override (time-limited, admin-only)
2. Environment Override (dev/staging/prod)
3. Project Override (project/client-specific)
4. Agent Override (agent-specific tuning)
5. Base Persona Document (repo markdown — source of truth)

### Task

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| title | string | — |
| description | text | — |
| status | enum | Backlog, Ready, In Progress, Waiting, Review, Done |
| ownerType | enum | Human, Agent |
| ownerId | uuid | FK → User or Agent |
| priority | enum | TBD (Low, Medium, High, Critical) |
| projectTag | string | — |
| runtimeRunId | string (nullable) | Runtime seam — links to execution run (see `03_RUNTIME_CONTRACT.md`) |
| lastRuntimeStatus | string (nullable) | Runtime seam — queued / running / completed / failed |
| createdBy | uuid | FK → User |
| createdAt | timestamp | — |
| updatedAt | timestamp | — |

### Conversation

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| agentId | uuid | FK → Agent |
| createdBy | uuid | FK → User |
| createdAt | timestamp | — |

### ConversationMessage

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| conversationId | uuid | FK → Conversation |
| senderType | enum | Human, Agent, System |
| content | text | — |
| metadata | json | — |
| createdAt | timestamp | — |

### User

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | — |
| email | string | Unique |
| role | enum | super_admin, admin, team_lead, contributor, viewer |
| createdAt | timestamp | — |

### AuditLog

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| actorId | uuid | FK → User |
| actionType | string | e.g. "persona_override_created" |
| entityType | string | e.g. "PersonaOverride" |
| entityId | uuid | — |
| beforeState | json | Snapshot before change |
| afterState | json | Snapshot after change |
| reason | text | Required note explaining why |
| timestamp | timestamp | — |

### UsageEvent (placeholder — future)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| agentId | uuid | FK → Agent |
| model | string | — |
| tokenCount | integer | — |
| costEstimate | decimal | — |
| timestamp | timestamp | — |

### KnowledgeSource (metadata only — Phase 1)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | — |
| type | string | SOW, PRD, Architecture, QA, etc. |
| path | string | Reference path in brain repo |
| createdAt | timestamp | — |

---

## 7. Agent Registry & Personas

### MVP Agents

**Axel — Engineering Agent**
- Senior systems engineer mindset
- Outputs: implementation plans, dependency maps, risk assessments, validation steps
- Default output format: Summary → Assumptions → Approach → Sequence → Risks → Validation → Open Questions
- Escalates on: security, data integrity, production risk, insufficient context
- Never invents: endpoints, schema fields, library versions, code locations
- Source: `_AGENTS/AXEL/persona.md`

**Riff — Product Agent**
- Product strategist / requirements translator
- Outputs: scope definitions, tickets with acceptance criteria, scope drift detection, SOW alignment
- Default output format: Intent → In-Scope → Out-of-Scope → Requirements → Acceptance Criteria → Dependencies → Risks → Open Questions → Next Steps
- Escalates on: scope/timeline/budget/compliance decisions, SOW conflicts
- Never invents: scope commitments, client approvals, undocumented business rules
- Source: `_AGENTS/RIFF/persona.md`

**Torque — QA Agent**
- Reliability specialist, skeptical but constructive
- Outputs: test scenarios, regression risk maps, edge case inventories, release readiness checklists
- Default output format: Critical Path → Regression Risks → Test Scenarios → Edge Cases → Data Conditions → Non-Functional Checks → Release Readiness → Missing Proof → Next Steps
- Risk scoring: Low / Medium / High (High triggered by: payments, auth, PII, integrations, async workflows, migrations, multi-tenant)
- Escalates on: untestable criteria, missing environments/data, no validation plan for risky changes
- Never claims: a test was run, a bug exists without evidence, coverage exists without documentation
- Source: `_AGENTS/TORQUE/persona.md`

### Shared Agent Behaviors (from `00_AGENT_GUIDELINES.md`)

- All agents are advisory-first, task-enabled
- All support the layered persona override system
- All have "No Hallucination" guardrails — label unknowns, never fabricate specifics
- All require human review before closing tasks
- All reference knowledge sources by filename/section when available
- All support Control Center customization of: rules, skills, templates, knowledge scope, escalation thresholds, risk tolerance

### Phase 2 Agents (not built now, but data model must support them)

- **Clutch** — Operations Agent (workflow routing, SOP clarity, process coordination)
- **Gauge** — Business Development Agent (opportunity fit, scope realism, delivery risk)

---

## 8. Task System & Kanban

### Task statuses (Kanban columns):

1. **Backlog**
2. **Ready**
3. **In Progress**
4. **Waiting**
5. **Review**
6. **Done**

### Requirements:

- Tasks can be assigned to **humans or agents**
- Agents can be assigned tasks and can recommend tasks
- Drag-and-drop between columns
- Subtle hover states, no flashy animations
- Task cards display: title, owner (agent or human), priority, status, metadata (created date, project tag), minimal content preview
- No excessive decoration

### Agent task behavior:

- When an agent "completes" a task, the output is a structured deliverable (plan, checklist, ticket draft) — not autonomous execution
- Agents do not mark tasks "Done" autonomously; a human review step is always required

---

## 9. RBAC & Governance

### Roles (highest to lowest privilege):

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Full permission including hotfix overrides |
| **Admin** | Edit agent overrides, templates, apply changes |
| **Team Lead** | Propose overrides (requires Admin approval), assign tasks |
| **Contributor** | Suggest changes, cannot apply |
| **Viewer** | Read-only |

### Permission matrix covers:

- Edit agent persona metadata
- Apply persona overrides
- Create tasks
- Assign tasks
- Edit tasks
- View usage data
- View audit logs
- Modify configuration

### Governance rules:

- All persona modifications must be logged (who, what, when, why, which environment)
- Approval flow: Team Lead proposes → Admin approves and applies
- Hotfix overrides bypass approval but must be time-limited, require a reason, and be reviewed after the fact
- Persona versioning with changelog entries and rollback capability

### Implementation via Supabase:

- Authentication handled by Supabase Auth (email/password for internal users)
- Roles stored in a `user_roles` table (or equivalent) in Supabase Postgres
- Access enforced via RLS policies (preferred as system matures) or strict server-side role checks (acceptable for MVP if consistently enforced)
- Privileged operations (admin mutations, role changes) execute server-side only via Next.js Route Handlers

---

## 10. Design System Rules

Source: `01_DESIGN_GUIDE.md`

### Theme:

- **Dark mode only** (initially)
- Background: deep charcoal / near-black (not `#000000`)
- Layered elevation with subtle contrast
- Monochrome-first color palette with slight cool tone (optional subtle blue tint)
- Accent color used only for: active states, selected items, focus indicators, key highlights
- Error/warning/success colors: muted, subtle, not aggressive
- No bright gradients, no neon, no marketing-style color splashes

### Typography:

- System font stack or clean modern sans-serif
- No decorative fonts, no oversized hero headers, no flashy display text
- Hierarchy: H1 (page title) → H2 (section) → H3 (card/panel header) → Body1 → Body2 → Caption

### Layout:

- Persistent left sidebar
- Top header (optional per page)
- Main content panel
- Optional right-side contextual panel (future)
- 8px grid system
- Consistent internal padding

### Surfaces:

- Use MUI elevation sparingly
- Prefer subtle borders + tonal contrast over heavy shadows
- Surface hierarchy: Page background → Primary content → Card/panel → Interactive (hover)

### Interactions:

- Fast response, minimal animation
- No playful micro-interactions
- Functional hover states, clear disabled states
- Strong focus outlines for accessibility

### Icons:

- MUI Icons or similar clean line icon set
- Monochrome, no emoji, no cartoon illustrations in main UI

### Accessibility:

- Sufficient contrast ratios
- Keyboard navigation support
- Clear focus states
- Semantic HTML
- ARIA labels for interactive elements

### Hard rules — do NOT:

- Add gradients
- Add marketing banners
- Use random accent colors
- Use inconsistent spacing
- Mix design languages
- Add unnecessary animations
- Over-style buttons
- Create custom components when MUI supports it

---

## 11. Component Architecture

### Level 1 — Layout Components

- `AppShell` — overall app wrapper
- `Sidebar` — persistent left navigation
- `Header` — top bar (optional per page)
- `PageContainer` — main content wrapper
- `SectionContainer` — groups sections within a page

### Level 2 — Structural Containers

- `Card`, `Panel`, `Drawer`, `Dialog`, `Tabs`, DataGrid container

### Level 3 — Domain Components

- `AgentCard` — displays: name, role, status, persona version, assigned tasks count, last activity (future), action buttons (View/Edit/Disable)
- `TaskCard` — displays: title, owner (agent or human), priority, status, metadata (created date, project tag), minimal content preview
- `KanbanColumn` — one per status, supports drag-and-drop
- `ConversationThread` — stubbed for Phase 1
- `UsageStatBlock` — placeholder for Phase 1
- `StatusBadge` — muted color system (Active, Idle, Offline, Disabled, Error) — must include icon + text, never color alone
- `PersonaEditorPanel` — override editor with rules, skills, templates, knowledge scope, escalation, risk tolerance

### Level 4 — Primitives

Always use MUI: `Button`, `IconButton`, `Typography`, `TextField`, `Select`, `Switch`, `Chip`, `Divider`, `Tooltip`, `Avatar`

---

## 12. Phase 1 Deliverables (Ordered)

This is the build sequence. Each step produces a working increment.

### Step 1: Project Scaffolding

- Initialize Next.js (App Router) + TypeScript project
- Install and configure MUI v5+ with dark theme per design system rules
- Set up Supabase project (Postgres + Auth)
- Initialize Supabase client in `lib/` (browser client + server client)
- Set up project folder structure per Section 5
- Configure linting, formatting, build tooling
- Create initial Supabase database tables and migrations

### Step 2: Theme & Layout Shell

- Implement `AppShell` with persistent `Sidebar` and `Header`
- Implement `PageContainer` and `SectionContainer`
- Configure the full MUI theme (palette, typography, spacing, surface elevations)
- Implement dark mode color system
- Verify layout responsiveness and accessibility baseline

### Step 3: Authentication & RBAC Foundation

- Configure Supabase Auth (email/password for internal users)
- Set up Supabase session provider in root layout
- Implement protected route layout group `(auth)/` with session check
- Create `user_roles` table in Supabase with role validation
- Implement role-based access control (5 roles: Super Admin, Admin, Team Lead, Contributor, Viewer)
- Implement permission checks: RLS policies where practical, server-side role checks where needed
- Ensure no Supabase service keys are exposed to the browser
- Create Admin settings page shell
- Seed initial user data

### Step 4: Agent Registry

- Implement Agent model with CRUD API (include nullable `runtime_agent_id` field per runtime contract)
- Build Agent list page with `AgentCard` components
- Build Agent detail page (read-only view of persona metadata)
- Implement `StatusBadge` component (shows "Offline" for all agents until runtime exists)
- Seed the three MVP agents (Axel, Riff, Torque) with base persona data
- Implement agent status management (Offline, Active, Disabled, Planned)

### Step 5: Persona Override System

- Implement PersonaOverride model with CRUD API
- Build `PersonaEditorPanel` with fields for: rules, skills, templates, knowledge scope, escalation rules, risk tolerance
- Implement layered override precedence logic
- Implement persona versioning (version numbers, changelog)
- Implement rollback capability
- Build override approval flow (Team Lead proposes → Admin approves)

### Step 6: Audit Logging

- Implement AuditLog model
- Instrument all persona edits with audit entries (who, what, when, why, environment)
- Build audit log viewer (filterable by agent, user, action type, date)
- Enforce required "reason" field on all persona modifications

### Step 7: Task System

- Implement Task model with CRUD API (include nullable `runtime_run_id` and `last_runtime_status` fields per runtime contract)
- Build task creation form (title, description, owner type, owner, priority, project tag)
- Build task list view
- Implement task assignment to humans and agents
- Implement task status transitions

### Step 8: Kanban Board

- Build `KanbanColumn` components for all 6 statuses
- Build `TaskCard` components within columns
- Implement drag-and-drop between columns
- Subtle hover states per design system
- Filter/sort capabilities (by owner, priority, project)

### Step 9: Conversation Logging (Stub)

- Implement Conversation and ConversationMessage models
- Build basic conversation thread viewer
- This is a stub — no real agent messages flow through yet
- UI should be functional but clearly placeholder

### Step 10: Usage & Metrics (Placeholder)

- Implement UsageEvent model (schema only)
- Build placeholder dashboard page with empty state
- Display basic stats if any seed data exists (agent count, task count, etc.)

### Step 11: Knowledge Source Metadata

- Implement KnowledgeSource model (metadata only)
- Build knowledge source list view
- Allow tagging sources by type (SOW, PRD, Architecture, QA, etc.)
- Wire knowledge scope config in PersonaEditorPanel to reference these sources

### Step 12: Runtime Adapter Stub

- Define `RuntimeAdapter` TypeScript interface in `lib/runtime/` per `03_RUNTIME_CONTRACT.md`
- Implement stub adapter that returns placeholder data (agent status = Offline, usage = empty, etc.)
- Verify the stub compiles and is importable from feature modules without runtime dependencies

### Step 13: Polish & Hardening

- Full accessibility audit (contrast, keyboard nav, focus states, ARIA labels)
- Error handling and loading states across all pages
- Empty states for all list views
- Consistent spacing, typography, and surface hierarchy audit
- Error logging foundation
- Final build verification (zero errors, zero warnings)

---

## 13. Phase 1 Boundaries (Hard Stops)

If a decision point arises during implementation, these are the boundaries:

| Question | Answer |
|----------|--------|
| Should we call an LLM API? | **No.** Not in Phase 1. |
| Should we integrate Slack? | **No.** Not in Phase 1. |
| Should we build real agent execution? | **No.** Agents are metadata and task owners only. |
| Should we build embeddings/vector search for the Brain? | **No.** Metadata only. |
| Should we track tokens or model costs? | **No.** Schema placeholder only. |
| Should we build microservices? | **No.** Single app, single API, single DB. |
| Should we add a background job system? | **Only** if required by the app itself (e.g., audit log processing). |
| Should we couple to OpenClaw? | **No.** Define the adapter interface, do not implement it. |
| Should we use Tailwind or another CSS framework? | **No.** MUI only. |
| Should we add gradients, animations, or playful UI? | **No.** Command console aesthetic. |

---

## 14. Security & Performance Guidelines

### Security

Supabase is the security boundary. Every rule here must be enforced consistently.

- **All writes require authenticated users.** No anonymous mutations.
- **Roles must be stored and validated.** Use a `user_roles` table (or equivalent) in Supabase. Do not rely on client-side role claims alone.
- **Sensitive tables must enforce access** via RLS policies (preferred as the system matures) or strict server-side role checks (acceptable for internal MVP if consistently enforced).
- **No secrets in the browser.** Supabase service keys, runtime tokens, and any privileged credentials must never be exposed to client-side code. Use the Supabase anon key for browser clients; use the service-role key only in server-side code (Route Handlers, Server Actions).
- **Privileged operations run server-side only.** Admin mutations, service-role queries, and any operation that bypasses RLS must execute in Next.js Route Handlers or Server Actions, never from a client component.

### Performance

- **Scope queries.** Every Supabase query should select only the columns and rows it needs. Avoid full-table scans.
- **Paginate list views.** Tasks, audit logs, conversations, and any unbounded list must be paginated.
- **Index common filters.** Add database indexes on: task status + owner, agent id, persona override agent_id + scope_type, audit log timestamps.
- **Keep Next.js fast.** Avoid heavy server work in request/response paths. Avoid unnecessary middleware. Use static rendering where possible.
- **Limit global providers.** Only the MUI ThemeProvider and Supabase session provider should wrap the root layout. No unnecessary context layering.
- **No "god" utility layers.** Each feature module has its own small service wrapper around Supabase. No shared mega-service.
- **Isolate runtime connectors.** Any future runtime adapter goes in a dedicated module (`lib/runtime/` or similar), never spread across random routes or feature modules.

---

## 15. Future Integration Surface

The full runtime integration contract is defined in `docs/03_RUNTIME_CONTRACT.md`. It specifies data ownership boundaries, event flows (task dispatch, conversation sync, usage sync), persona delivery models, security boundaries, and the complete adapter interface.

When Phase 2+ arrives, the Control Center will integrate with a runtime through the **Runtime Adapter Interface**:

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

The Control Center only talks to this adapter. The adapter handles runtime specifics (OpenClaw, custom orchestration, alternative LLM gateway, etc.).

**Phase 1 runtime preparation (must be done now):**

- Define `RuntimeAdapter` interface in code with a stub implementation (in `lib/runtime/`)
- Include nullable runtime-seam DB fields: `agent.runtime_agent_id`, `task.runtime_run_id`, `task.last_runtime_status`
- UI placeholders: agent status shows "Offline," usage dashboard shows "No data"
- Task model supports execution artifact attachment (run logs / outputs)

**Future phases will also add:**

- Clutch (Operations Agent) and Gauge (Business Development Agent)
- Slack message routing and conversation sync
- Persistent agent sessions
- Token usage dashboards and cost tracking
- Knowledge indexing and retrieval from the Brain
- Async task processing
- External connectors (GitLab, Slack, etc.)
- Multi-environment deployment
- Agent activity monitoring and runtime health checks
- Persona delivery to runtime (pull model recommended for MVP)

---

## 16. Success Criteria

Phase 1 is successful when:

- [ ] Clean internal documentation exists and is maintained
- [ ] Architectural foundation is clear and decoupled
- [ ] Control Center is stable and usable
- [ ] Task + Kanban workflow is functional with drag-and-drop
- [ ] Agent metadata model is clean with all three MVP agents seeded
- [ ] Persona override system works with layered precedence
- [ ] All persona edits are auditable with versioning and rollback
- [ ] RBAC is enforced across the application
- [ ] Design system is consistently applied (dark, monochrome, MUI-only)
- [ ] New contributors can onboard easily by reading the docs
- [ ] Build produces zero errors and zero warnings

---

## 17. Source Document Index

| Document | Path | Contains |
|----------|------|----------|
| Product Overview | `docs/00_OVERVIEW.md` | Vision, scope, agents, components, governance, non-goals |
| Design Guide | `docs/01_DESIGN_GUIDE.md` | MUI rules, theme, typography, layout, components, accessibility |
| Architecture | `docs/02_ARCHITECTURE.md` | Layers, domain model, RBAC, deployment, security, extensibility |
| Runtime Contract | `docs/03_RUNTIME_CONTRACT.md` | Adapter interface, event flows, data ownership, security boundaries, MVP runtime seams |
| Agent Guidelines | `docs/_AGENTS/00_AGENT_GUIDELINES.md` | Persona training, override system, governance, storage strategy |
| Axel Persona | `docs/_AGENTS/AXEL/persona.md` | Engineering agent identity, mission, SOPs, guardrails |
| Riff Persona | `docs/_AGENTS/RIFF/persona.md` | Product agent identity, mission, SOPs, guardrails |
| Torque Persona | `docs/_AGENTS/TORQUE/persona.md` | QA agent identity, mission, SOPs, guardrails |

---

*This plan is the single working reference for building FullThrottle AI Phase 1. All implementation decisions should trace back to this document and the source docs it references.*
