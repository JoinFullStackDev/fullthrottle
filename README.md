# FullThrottle AI

Internal multi-agent operations platform for FullStack. Manages AI agent personas, tasks, and knowledge through a structured Control Center — without coupling to any specific agent runtime in Phase 1.

---

## What This Is

FullThrottle AI provides:

- **Control Center** — Web application for managing agent configuration, tasks, and governance
- **Agent Registry** — Structured profiles for AI agents with layered persona overrides
- **Task System** — Kanban-based task management assignable to humans or agents
- **Persona Override System** — Versioned, auditable configuration with approval workflows
- **RBAC** — Role-based access control (Super Admin, Admin, Team Lead, Contributor, Viewer)
- **Knowledge Workspace** — Metadata layer for structured documentation (the "FullStack Brain")

This is internal infrastructure. Not a chatbot. Not consumer-facing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| UI Library | MUI v5+ |
| Backend / Database | Supabase (Postgres + Auth + RLS) |
| Data Access | Supabase JS client + feature-level service wrappers |
| Auth | Supabase Auth (email/password, internal only) |

---

## MVP Agents

| Agent | Role | Focus |
|-------|------|-------|
| **Axel** | Engineering | Implementation plans, dependency maps, risk assessments, validation steps |
| **Riff** | Product | Scope definitions, ticket drafting, acceptance criteria, SOW alignment |
| **Torque** | QA | Test scenarios, regression risk maps, edge case inventories, release readiness |

All agents are **advisory-first, task-enabled**. Humans remain accountable for all decisions.

---

## Project Structure

```
fullthrottle/
  docs/                              # Specifications and design docs
    PLAN.md                          # Master implementation plan
    01_DESIGN_GUIDE.md               # Design system reference
    02_ARCHITECTURE.md               # Architecture overview
    03_RUNTIME_CONTRACT.md           # Runtime adapter boundary spec
    _AGENTS/                         # Agent persona definitions
      00_AGENT_GUIDELINES.md         # Shared agent behaviors and override system
      AXEL/persona.md               # Engineering agent
      RIFF/persona.md               # Product agent
      TORQUE/persona.md             # QA agent
  src/                               # Application source (Phase 1 build)
    app/                             # Next.js App Router (routes + layouts)
    components/                      # Shared UI components
    features/                        # Self-contained domain modules
      agents/                        # Agent registry
      personas/                      # Persona overrides, versioning
      tasks/                         # Task CRUD, Kanban board
      conversations/                 # Conversation log viewer (stub)
      usage/                         # Usage metrics (placeholder)
      audit/                         # Audit log viewer
    lib/                             # Supabase client, shared types, runtime adapter
    hooks/                           # Shared custom hooks
    theme/                           # MUI theme configuration
```

---

## Phase 1 Scope

Phase 1 is **modeling + orchestration scaffolding**. It builds the Control Center foundation without calling any LLM APIs or integrating external runtimes.

**Included:** Agent registry, persona overrides with versioning, task system with Kanban, RBAC, audit logging, knowledge source metadata, runtime adapter interface (stub only).

**Excluded:** LLM API calls, Slack integration, autonomous agent execution, embedding pipelines, token tracking, microservices.

See `docs/PLAN.md` Section 13 for the full boundary table.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (Postgres + Auth)

### Setup

```bash
cd fullthrottle
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

Build must produce **zero errors and zero warnings**.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [Implementation Plan](docs/PLAN.md) | Master build reference — all decisions trace here |
| [Design Guide](docs/01_DESIGN_GUIDE.md) | MUI theme, typography, layout, component rules |
| [Architecture](docs/02_ARCHITECTURE.md) | Layers, domain model, RBAC, security, extensibility |
| [Runtime Contract](docs/03_RUNTIME_CONTRACT.md) | Adapter interface, event flows, data ownership boundaries |
| [Agent Guidelines](docs/_AGENTS/00_AGENT_GUIDELINES.md) | Persona system, override mechanics, governance |

---

## Key Principles

- **Runtime-agnostic.** The Control Center never assumes a specific agent provider or model.
- **Decoupled layers.** Persona, Knowledge, Permissions, and Runtime are strictly separated.
- **Security-first.** Supabase is the security boundary. No secrets in the browser.
- **Observable.** All persona edits are logged and auditable.
- **Expandable.** Must support additional agents, environments, and external connectors in future phases.
