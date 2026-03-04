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
  supabase/migrations/               # SQL schema + seed data
  docs/                              # Specifications and design docs
    PLAN.md                          # Master implementation plan
    01_DESIGN_GUIDE.md               # Design system reference
    02_ARCHITECTURE.md               # Architecture overview
    03_RUNTIME_CONTRACT.md           # Runtime adapter boundary spec
    _AGENTS/                         # Agent persona definitions
  src/
    app/                             # Next.js App Router (routes + layouts)
      (auth)/                        # Auth-gated layout group (server session check)
      api/admin/                     # Privileged API routes (users, seed)
      login/                         # Login page
    components/                      # Shared UI components (layout, shared)
    features/                        # Self-contained domain modules
      agents/                        # service.ts, hooks, components
      personas/                      # service.ts, components
      tasks/                         # service.ts, hooks, components (Kanban)
      conversations/                 # service.ts, components (stub)
      usage/                         # service.ts, components (placeholder)
      audit/                         # service.ts
      knowledge/                     # service.ts
    lib/                             # Supabase clients, types, permissions, runtime adapter
    hooks/                           # useAuth
    theme/                           # MUI theme configuration
    proxy.ts                         # Next.js 16 proxy (session refresh)
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

Create a `.env` (or `.env.local`) file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Setup

1. Run the SQL migrations against your Supabase project (via the SQL Editor in the Supabase Dashboard, or the Supabase CLI):

   - `supabase/migrations/00001_initial_schema.sql` — Creates all tables, enums, indexes, triggers, and RLS policies
   - `supabase/migrations/00002_seed_data.sql` — Seeds the 3 MVP agents and knowledge sources

2. Create an initial user via the Supabase Auth dashboard (email/password).

3. After signing in, promote your user to `super_admin` by running this SQL in the Supabase SQL Editor:

   ```sql
   UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
   ```

4. (Optional) Seed sample tasks, overrides, and audit logs by calling the dev seed endpoint:

   ```
   POST /api/admin/seed
   ```

   This requires an authenticated admin session and is disabled in production.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

Build must produce **zero errors and zero warnings**.

### Architecture Notes

- **Auth:** Cookie-based sessions via `@supabase/ssr`. The `src/proxy.ts` file (Next.js 16 convention) refreshes the session on every request.
- **Protected routes:** The `(auth)/layout.tsx` is a Server Component that checks for an active session and redirects to `/login` if none exists.
- **Service pattern:** Each feature module has a `service.ts` that wraps all Supabase queries for that domain. Components never call Supabase directly.
- **RBAC:** The `useAuth` hook provides the current user and role. The `lib/permissions.ts` utility maps roles to allowed actions. The `RoleGate` component conditionally renders based on permissions.
- **API routes:** `api/admin/users` (list/update user roles) and `api/admin/seed` (dev seed) use the service-role key server-side.

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
