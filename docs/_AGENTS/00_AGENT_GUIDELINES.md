# Control Center Support: Persona Training + Customization (MVP Requirement)

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Core Principle: Layered Persona Assembly](#2-core-principle-layered-persona-assembly)
3. [Persona Versioning Requirements](#3-persona-versioning-requirements)
4. [Customization Capabilities (MVP)](#4-customization-capabilities-mvp)
5. [Governance Requirements](#5-governance-requirements)
6. [Storage Strategy (Recommended)](#6-storage-strategy-recommended)
7. [How Personas Should Reference This Document](#7-how-personas-should-reference-this-document)
8. [MVP Deliverable Checklist](#8-mvp-deliverable-checklist)
9. [One Sentence Summary](#9-one-sentence-summary)

---

## 1. Purpose

This document defines the shared, platform-level requirements for how the Control Center must support persona training and customization across all agents.

Personas will evolve. We need a system that allows controlled tuning over time without rewriting base persona documents or introducing inconsistency between environments.

The Control Center must support:

- Persona versioning
- Persona overrides
- Skills and rules management
- Knowledge scope configuration
- Auditing and governance

Base persona definitions live in the repository as the source of truth.
The Control Center provides configurable overrides that apply at runtime.

---

## 2. Core Principle: Layered Persona Assembly

At runtime, an agent's effective persona is assembled from layered inputs.

**Override Precedence** (highest to lowest):

1. Emergency Hotfix Override (time-limited, admin-only)
2. Environment Override (dev/staging/prod)
3. Project Override (project/client-specific)
4. Agent Override (agent-specific tuning)
5. Base Persona Document (repo source of truth)

This layered approach prevents drift while allowing targeted customization.

---

## 3. Persona Versioning Requirements

The Control Center must support:

- A persona "version number" per agent (e.g., v1.0, v1.1)
- A changelog entry for persona edits (who/what/why)
- The ability to roll back to a prior version
- An audit trail of changes

Base personas in the repo should be treated as canonical.
Control Center overrides should be treated as operational tuning.

---

## 4. Customization Capabilities (MVP)

The Control Center must provide editable fields that can be applied as overrides to any agent:

### 4.1 Rules

Rules are explicit Do/Don't constraints.

**Examples:**

- Do not propose production changes without a human review step.
- Always include assumptions.
- Never invent endpoints.
- Use the "Ticket Drafting Standard" template.

Rules should be:

- structured
- ordered
- individually enable/disable-able

---

### 4.2 Skills

Skills are capabilities the agent may be allowed to use or not use.

In MVP, skills are primarily advisory behaviors, not tool execution.

**Examples:**

- Generate engineering implementation plans
- Draft user stories and acceptance criteria
- Generate test plans and regression checklists
- Convert Slack threads to tasks
- Produce risk analysis and mitigation summaries

Later phases may include tool-enabled skills:

- Create tasks automatically
- Read from a knowledge index
- Pull context from connected systems

Skills must be toggleable by admins.

---

### 4.3 Output Templates

Output templates control formatting and structure.

**Examples:**

- Engineering plan format
- Ticket format
- Test case format
- Release readiness format

Templates must be selectable per agent and per project.

---

### 4.4 Knowledge Scope

Knowledge scope determines what the agent is allowed to reference.

In MVP, this is modeled at the metadata level and enforced by configuration and workspace scoping.

The Control Center must support:

- Allowed folders/domains (SOW/PRD/QA/Ops/BD/Architecture)
- Allowed projects/clients
- "Restricted sources" list
- Knowledge freshness rules (prefer newest documents)

---

### 4.5 Escalation Rules

Agents must know when to stop and escalate.

The Control Center must allow tuning for:

- Escalation thresholds (strict vs flexible)
- Required escalation conditions (compliance, payments, auth, migrations)
- Escalation output format

---

### 4.6 Risk Tolerance

Agents should have a configurable "risk posture."

**Examples:**

- Conservative (default)
- Balanced
- Aggressive (only in low-stakes contexts)

**Risk posture impacts:**

- how strongly the agent recommends shipping
- how quickly it blocks on missing info
- whether it proposes shortcuts

---

## 5. Governance Requirements

The Control Center must enforce:

### 5.1 Roles

- **Super Admin:** Full permission including hotfix overrides
- **Admin:** Can edit agent overrides and templates
- **Team Lead:** Can propose overrides, requires approval
- **Contributor:** Can suggest changes, cannot apply
- **Viewer:** Read-only

### 5.2 Audit Logging

Log every edit with:

- who changed it
- what changed
- when
- why (required note)
- what environment it impacted

### 5.3 Approval Flow (Recommended for MVP)

- Team Lead proposes change
- Admin approves and applies

Hotfix overrides bypass approval but must:

- be time-limited
- require a reason
- be reviewed after the fact

---

## 6. Storage Strategy (Recommended)

### Base Personas

Stored in repo as markdown:

- `docs/_AGENTS/<agent>/persona.md`

### Overrides

Stored in **Supabase Postgres** as structured JSON with:

- `agent_id`
- `scope_type` (agent/project/environment/hotfix)
- `scope_id` (project id, environment, etc.)
- `rules[]`
- `skills[]`
- `templates{...}`
- `knowledge_scope{...}`
- `escalation{...}`
- `risk_tolerance`
- `created_by`, `approved_by`, timestamps

All override writes require an authenticated user. Access is enforced via Supabase RLS policies (preferred as the system matures) or strict server-side role checks (acceptable for internal MVP if consistently enforced). Override tables should be indexed on `agent_id` and `scope_type` for efficient lookup.

This enables:

- fast iteration
- structured enforcement
- clear audit trails

---

## 7. How Personas Should Reference This Document

Each agent persona doc should:

- define the base role, defaults, and guardrails
- explicitly state that runtime behavior may be altered by Control Center overrides
- avoid hardcoding things that are meant to be configurable (templates, skills toggles, thresholds)

---

## 8. MVP Deliverable Checklist

**For MVP, the Control Center must provide:**

- Agent override editor (rules, skills, templates)
- Persona version tracking
- Audit log
- Ability to enable/disable skills per agent
- Knowledge scope metadata configuration
- Escalation rule configuration

**Not required in MVP:**

- automated model routing
- tool execution permissions management
- Slack-based persona edits
- advanced fine-tuning workflows

---

## 9. One Sentence Summary

The Control Center must provide a structured, auditable, layered override system that lets FullStack safely tune agent personas over time without drifting away from the repository source-of-truth.
