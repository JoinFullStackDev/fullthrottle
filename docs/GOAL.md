# FullThrottle AI — Team Briefing

**Date:** March 10, 2025
**Author:** [Your Name]
**Status:** Phase 1 Complete — VPS Deployment This Week

---

## What Is This?

FullThrottle AI is our internal multi-agent operations platform. It gives us an AI layer across engineering, product, and QA — not as a replacement for anyone, but as a structured set of role-defined AI teammates that reduce context switching, surface risk earlier, and prepare work so the team can execute faster with better context.

This is **not** a chatbot, not client-facing, and not a generic AI assistant. It's internal delivery infrastructure.

---

## How It Works — The Pipeline

This is the core workflow. Understanding this is the most important part of this doc.

```
┌───────────┐    ┌──────────┐    ┌────────────────┐    ┌───────────────┐    ┌────────────┐
│           │    │          │    │                │    │               │    │            │
│   Slack   │───▶│    PM    │───▶│  Axel / Riff   │───▶│    Clutch     │───▶│    Team    │
│  (intake) │    │ (review  │    │   / Torque     │    │ (VPS Agent)   │    │ (execution)│
│           │    │  + route)│    │  (agent work)  │    │               │    │            │
└───────────┘    └──────────┘    └────────────────┘    └───────────────┘    └────────────┘
```

### Step by Step

**1. Intake — Slack → Backlog**
A task lands in the backlog, originating from Slack.

**2. Routing — PM Reviews and Assigns**
The project manager reviews the task and assigns it to the right agent based on what the work needs:

| If the work needs... | It goes to... |
|---------------------|---------------|
| Architecture, implementation planning, risk mapping | **Axel** (Engineering) |
| Scope clarity, requirements, acceptance criteria | **Riff** (Product) |
| Test scenarios, regression analysis, release readiness | **Torque** (QA) |

**3. Agent Work — The Agent Owns the Task**
The assigned agent picks up the task and does their job — writing implementation plans, structuring requirements, generating test scenarios, whatever their domain calls for. As they progress, they move the task through the Kanban pipeline:

```
Backlog → Ready → In Progress → Waiting → Review → Done
```

The agent is actively owning and progressing the work, not just advising on the side.

**4. Handoff — Clutch Takes It From Here**
Once the agent completes their work, **Clutch** (our operations agent running on the VPS) picks up the finished task along with all related documentation and deliverables. Clutch then:

- Posts the completed work and documentation to **Slack** for the team
- **End goal:** Creates a **GitLab issue** from the deliverables and assigns it to the engineering manager, who distributes it to the team

**5. Execution — The Team Builds It**
The team receives fully prepared, contextualized work — implementation plans with risk analysis, structured requirements with acceptance criteria, test plans with edge cases — and executes.

### Where Humans Are in the Loop

- **PM at intake** — routing the right work to the right agent
- **Team at execution** — building from the agent's deliverables
- **Admins for configuration** — tuning agent personas, managing knowledge, overrides

The agents handle the preparation and structuring in between. The team doesn't have to guess what to build or how to validate it.

---

## The Agents

### Active — Phase 1

| Agent | Role | What They Produce | LLM Provider |
|-------|------|-------------------|--------------|
| **Axel** | Engineering | Implementation plans, dependency maps, risk analysis, PR checklists, rollout strategies | Anthropic (Claude Sonnet) |
| **Riff** | Product | Structured requirements, acceptance criteria, scope boundary definitions, ticket drafts, scope drift detection | Anthropic (Claude Haiku) |
| **Torque** | QA | Test scenarios, regression risk maps, edge case inventories, release readiness checklists | Google (Gemini 2.5 Flash) |

Each agent has a distinct persona with their own communication style, response format, guardrails, and domain expertise. They're not general-purpose — Axel thinks like a senior systems engineer, Riff thinks like a product strategist, Torque thinks like a reliability specialist who assumes everything breaks.

### Active — VPS Agent

| Agent | Role | What They Do |
|-------|------|-------------|
| **Clutch** | Operations | Picks up completed agent work, posts deliverables to Slack, creates GitLab issues (goal), routes work to the team |

Clutch is the bridge between the agentic pipeline and the team. Clutch runs on the VPS and handles workflow routing, Slack delivery, and GitLab integration.

### Planned — Phase 2

| Agent | Role | Focus |
|-------|------|-------|
| **Gauge** | Business Development | Opportunity fit, scope realism, delivery risk assessment before commitments |

---

## The Control Center

The Control Center is the web application where everything is managed. Here's what's in it:

### Conversations
Chat one-on-one with any agent, or start a **Round Table** where multiple agents respond to the same prompt sequentially (each seeing what the others said). Responses stream in real-time with full markdown rendering, syntax-highlighted code blocks, and document citations. You can reference internal documents during chat using a slash command (`/`).

### Task Board
Six-column Kanban board with drag-and-drop. Tasks can be assigned to humans or agents, tagged by project and priority. This is where the PM routes work and where agents progress tasks through the pipeline.

### Knowledge Workspace
Curated repository of internal docs — SOWs, PRDs, architecture docs, QA plans, SOPs. Documents can be manually uploaded or synced from Google Drive. Content gets chunked and stored so agents have it as context during their work. Each agent's access is scoped through their persona configuration.

### Persona Override System
The tuning layer for agent behavior. Every agent starts with a base persona, and on top of that you can layer overrides that control:

- **Rules** — Do/don't constraints (e.g., "Always include assumptions," "Never invent endpoints")
- **Skills** — Capabilities the agent can use (toggleable)
- **Output Templates** — Response format definitions
- **Knowledge Scope** — Which folders/projects the agent can reference
- **Escalation Rules** — When and how to hand off to a human
- **Risk Tolerance** — Conservative, balanced, or aggressive posture

Overrides stack with clear precedence: Hotfix > Environment > Project > Agent > Base Persona. Everything is versioned, requires a reason for changes, and is logged in an immutable audit trail.

### Audit Logging
Every persona change, agent update, task creation, and user invitation is logged with who, what, when, why, and before/after state snapshots. The log is append-only and immutable.

### Role-Based Access Control

| Role | What You Can Do |
|------|----------------|
| **Super Admin** | Everything, including user management and hotfix overrides |
| **Admin** | Full operational access — agents, personas, integrations, knowledge, audit |
| **Team Lead** | Create/assign tasks, propose persona overrides (need admin approval), view audit logs |
| **Contributor** | Create and edit tasks |
| **Viewer** | Read-only across all views |

Security is enforced at three layers: database (Row Level Security), API (server-side role checks), and UI (permission gates). No secrets in the browser.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | React 19 + MUI v7 (dark mode command console aesthetic) |
| Backend / DB | Supabase (Postgres + Auth + Row Level Security + Storage) |
| LLM (Anthropic) | Claude via @anthropic-ai/sdk |
| LLM (Google) | Gemini via @google/generative-ai |
| Integrations | Google Drive (live), Slack (in progress), GitLab (API credits ready) |

---

## How the Pieces Connect — Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Control Center                          │
│                      (Next.js Web App)                        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
│  │  Agents  │  │  Tasks   │  │   Chat    │  │  Knowledge │  │
│  │ Registry │  │  Kanban  │  │ Streaming │  │  Workspace │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └─────┬──────┘  │
│       │              │              │               │         │
│       └──────┬───────┴──────┬───────┘               │         │
│              │              │                       │         │
│       ┌──────▼──────┐ ┌────▼─────────┐     ┌──────▼──────┐  │
│       │   Persona   │ │   Message    │     │ Google Drive │  │
│       │  Assembler  │ │   Pipeline   │     │    Sync     │  │
│       └──────┬──────┘ └──┬───────┬───┘     └─────────────┘  │
│              │           │       │                            │
└──────────────┼───────────┼───────┼────────────────────────────┘
               │           │       │
        ┌──────▼───────────▼─┐  ┌──▼──────────┐
        │     Supabase       │  │  LLM APIs   │
        │  (Postgres + Auth  │  │  - Anthropic │
        │   + RLS + Storage) │  │  - Google    │
        └─────────┬──────────┘  └─────────────┘
                  │
        ┌─────────▼──────────┐
        │    Clutch (VPS)    │
        │  - Slack posting   │
        │  - GitLab issues   │
        │  - Workflow routing │
        └─────────┬──────────┘
                  │
          ┌───────▼───────┐
          │  Slack / GitLab│
          │   (Team sees   │
          │   deliverables)│
          └───────────────┘
```

When an agent works on a task, here's what happens behind the scenes:

1. The **Persona Assembler** builds the agent's full system prompt — base persona + active overrides + assigned tasks + agent metadata
2. The **Knowledge Resolver** finds relevant documents based on the agent's knowledge scope
3. Conversation history and task context are loaded
4. Everything goes to the LLM provider (Anthropic or Google depending on the agent)
5. Response streams back in real-time via Server-Sent Events
6. Messages are stored, usage is logged, task status is updated

---

## What's Happening This Week

### VPS Deployment
The VPS is being set up this week. Once it's live:

- The Control Center will be deployed and accessible
- Clutch will be running on the VPS handling Slack delivery
- You'll be able to log in with your invited credentials and see the pipeline in action

### What You'll Need
Once you receive your invite email:

1. Click the magic link
2. Set your password, name, and optional avatar on the onboarding page
3. You're in

---

## What's NOT Built Yet

- **GitLab issue creation** — API credits are ready, wiring is in progress. Goal is for Clutch to create issues and assign to the engineering manager.
- **Gauge (BD agent)** — Planned for Phase 2
- **Embedding pipelines / vector search** — Knowledge is chunk-based for now, not semantic
- **Token budgets and real cost tracking** — Placeholder metrics only in Phase 1
- **Shell execution / browser automation** — Deferred

---

## Core Principles

1. **Agents own preparation, humans own execution** — Agents do the structuring, planning, and analysis. The team builds from their deliverables.
2. **Agents are role-defined** — Not general-purpose. Each one has a domain, a persona, guardrails, and a specific output format.
3. **Everything is auditable** — Every config change is logged with who, what, when, why, and before/after state.
4. **Security is layered** — Database, API, and UI enforcement. No secrets in the browser.
5. **Runtime-agnostic** — We can swap or add LLM providers without redesigning anything.

---

## Questions?

Reach out to [Your Name] or drop them in [channel]. We'll do a walkthrough once the deployment is live.
