# FullThrottle AI

**Product Requirements Overview (High-Level Context)**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Vision](#2-vision)
3. [Core Agents (Initial Lineup)](#3-core-agents-initial-lineup)
4. [System Components](#4-system-components)
5. [Phase 1 Scope (Strict Boundaries)](#5-phase-1-scope-strict-boundaries)
6. [Architectural Principles](#6-architectural-principles)
7. [Data Model (Conceptual)](#7-data-model-conceptual)
8. [Governance and Permissions](#8-governance-and-permissions)
9. [Design Direction](#9-design-direction)
10. [Non-Goals](#10-non-goals)
11. [Success Criteria](#11-success-criteria)
12. [Implementation Notes for Contributors](#12-implementation-notes-for-contributors)
13. [One Sentence Summary](#13-one-sentence-summary)

---

## 1. Project Overview

FullThrottle AI is an internal multi-agent operations platform built for FullStack.

The system will provide a structured, role-defined AI layer that augments the existing delivery organization across engineering, product, QA, operations, and business development.

- This is not a chatbot.
- This is not a consumer AI tool.
- This is not client-facing software.

This is internal infrastructure.

The platform consists of:

- A Control Center (web application)
- A structured Agent Registry
- A centralized Task System with Kanban visualization
- A Knowledge Workspace ("FullStack Brain")
- A future Agent Runtime integration layer (OpenClaw or equivalent)

The immediate goal is to build the Control Center and internal data model first, without coupling tightly to any agent runtime.

---

## 2. Vision

Create an internal AI operating layer that:

- Reduces context switching
- Reduces repetitive knowledge retrieval
- Improves delivery clarity
- Standardizes responses across functions
- Surfaces risk earlier
- Increases leverage across the organization

Agents will act as role-defined internal teammates.

They are advisory-first, task-enabled, and permission-scoped.

Humans remain accountable.

---

## 3. Core Agents (Initial Lineup)

These agents are modeled after real internal roles.

### Axel – Engineering Agent

**Focus:**

- Architecture reasoning
- Integration planning
- Implementation path analysis
- Dependency and risk mapping

### Riff – Product Agent

**Focus:**

- Scope clarity
- Requirement structuring
- Acceptance criteria drafting
- SOW alignment
- Ambiguity detection

### Torque – QA Agent

**Focus:**

- Regression risk
- Test scenario generation
- Edge case modeling
- Release readiness validation

### Clutch – Operations Agent (Phase 2)

**Focus:**

- Workflow routing
- SOP clarity
- Process coordination

### Gauge – Business Development Agent (Phase 2)

**Focus:**

- Opportunity fit
- Scope realism
- Delivery risk before commitments

Phase 1 will prioritize Axel, Riff, and Torque.

---

## 4. System Components

### 4.1 Control Center (Primary Focus Now)

The Control Center is a web-based internal application built with **Next.js (App Router) + TypeScript + Material UI** for the UI, and **Supabase** for Postgres, authentication, and access control.

Next.js serves as a clean application shell and orchestration layer — pages, components, and thin server-side endpoints only where needed. Supabase owns the backend primitives: authentication, data storage, and access control. Business logic stays out of React components. The codebase is organized by feature modules (agents, personas, tasks, audit, etc.).

It will manage:

- Agent Registry
- Agent persona configuration (metadata only initially)
- Task management
- Kanban visualization
- Conversation logs (stubbed)
- Usage metrics (placeholder initially)
- Role-based access control (via Supabase Auth + roles)

This application must be built independently of any agent runtime integration.

---

### 4.2 FullStack Brain (Knowledge Layer)

The Brain is a structured repository of internal documentation.

It contains:

- SOWs
- PRDs
- Architecture documentation
- QA plans
- SOPs
- Proposal history
- Decisions
- Meeting summaries

The Brain is not an AI system.

It is a curated, structured knowledge base that agents will eventually reference.

The Brain must be organized and versioned clearly.

---

### 4.3 Agent Runtime Layer (Future Phase)

In later phases, the system will integrate with a persistent agent runtime (e.g., OpenClaw). The full integration boundary is defined in `docs/03_RUNTIME_CONTRACT.md`.

The runtime will:

- Maintain agent sessions
- Execute reasoning tasks
- Connect via Slack
- Dispatch tasks asynchronously
- Track usage

However:

- No runtime integration is required for Phase 1.
- Do not build direct OpenClaw coupling yet.
- Phase 1 must define the `RuntimeAdapter` interface in code (stub implementation) and include nullable runtime-seam fields in the database so integration later is wiring, not redesign.

---

## 5. Phase 1 Scope (Strict Boundaries)

**Build:**

- Control Center UI
- Agent Registry
- Agent metadata model
- Task system
- Kanban board
- Basic conversation logging
- Role-based permissions
- Placeholder usage tracking
- Structured documentation

**Do NOT build:**

- Shell execution
- Browser automation
- Slack integration
- Token tracking
- Direct runtime calls
- Production code writing
- Autonomous task execution
- Client-facing features

Phase 1 is internal modeling + orchestration scaffolding only.

---

## 6. Architectural Principles

1. **Decoupled runtime** — The Control Center must not assume a specific agent provider.
2. **Advisory-first** — Agents provide recommendations before any automation.
3. **Clear separation of concerns** — Persona ≠ Knowledge ≠ Permissions.
4. **Security-first** — No broad file system or credential access. Supabase is the security boundary. No secrets (service keys, runtime tokens) may be exposed to the browser. Privileged operations run server-side only.
5. **Thin application shell** — Next.js handles pages, components, and minimal server-side endpoints. Supabase owns auth, data, and access control. Avoid turning Next into a large "backend-in-a-frontend."
6. **Observability** — Usage and activity must be measurable.
7. **Expandable** — The architecture must support:
   - Multiple agents
   - Additional agent types
   - Runtime abstraction
   - Multi-environment deployment

---

## 7. Data Model (Conceptual)

**Entities:**

- `Agent`
- `AgentPersona`
- `Task`
- `TaskStatus`
- `Conversation`
- `ConversationMessage`
- `User`
- `Role`
- `UsageEvent` (future)
- `KnowledgeSource` (metadata only in Phase 1)

Tasks may be assigned to:

- Human users
- Agents

Agents may:

- Recommend tasks
- Be assigned tasks
- Have status states (Offline, Planned, Active)

---

## 8. Governance and Permissions

**Internal roles:**

- Super Admin
- Admin
- Team Lead
- Contributor
- Viewer

Permissions determine:

- Who can edit agent persona metadata
- Who can create tasks
- Who can assign tasks
- Who can see usage data
- Who can modify configuration

All changes to agent persona metadata must be auditable.

---

## 9. Design Direction

**Tone:**

- Industrial
- Clean
- Dark mode default
- Performance-oriented
- Minimal clutter

This is internal infrastructure, not a playful app.

The visual language should reflect:

- Control
- Performance
- Systems
- Reliability

---

## 10. Non-Goals

This project is not:

- A replacement for human engineering
- A replacement for Jira/GitLab issues (initially)
- A client portal
- A generic AI chatbot
- A marketing product
- A production automation engine (yet)

---

## 11. Success Criteria

Phase 1 success is defined by:

- Clean internal documentation
- Clear architectural foundation
- Stable Control Center
- Usable task + Kanban workflow
- Clean agent metadata model
- Easy onboarding for new contributors

Phase 1 is about building a strong platform foundation.

---

## 12. Implementation Notes for Contributors

When working on this project:

- Do not assume OpenClaw-specific APIs.
- Do not couple directly to Slack.
- Keep runtime abstraction in mind.
- Write clean, testable modules.
- Prefer explicit configuration over magic.
- Document architectural decisions in `/docs/adr`.
- Organize code by feature modules (agents, personas, tasks, audit, etc.), not by technical layer.
- Keep business logic out of React components — use small, feature-level service wrappers around Supabase.
- Minimize Next.js API routes. Use them only where server-side execution is required (e.g., privileged Supabase operations).
- Never expose Supabase service keys or runtime tokens to the browser.
- All writes must require authenticated users. Roles must be stored and validated (e.g., `user_roles`).
- Use Supabase RLS policies where practical (preferred as the system matures), or strict server-side role checks (acceptable for internal MVP if consistently enforced).
- Keep future runtime connectors isolated in a dedicated adapter module — never spread across random routes.

---

## 13. One Sentence Summary

FullThrottle AI is an internal multi-agent operations platform that provides structured AI teammates, task orchestration, and knowledge management to improve delivery clarity and leverage across FullStack.
