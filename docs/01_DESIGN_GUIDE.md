# FullThrottle AI

**Design System Reference**

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Core UI Framework](#2-core-ui-framework)
3. [Theme Requirements](#3-theme-requirements)
4. [Typography](#4-typography)
5. [Layout Principles](#5-layout-principles)
6. [Component Hierarchy](#6-component-hierarchy)
7. [Common UI Patterns](#7-common-ui-patterns)
8. [Interaction Principles](#8-interaction-principles)
9. [Iconography](#9-iconography)
10. [Accessibility Requirements](#10-accessibility-requirements)
11. [What To Avoid](#11-what-to-avoid)
12. [Design System Ownership](#12-design-system-ownership)
13. [One-Sentence Design Summary](#13-one-sentence-design-summary)

---

## 1. Design Philosophy

FullThrottle AI is internal infrastructure.

The interface must reflect:

- Control
- Stability
- Performance
- Precision
- Professionalism

- This is not a marketing site.
- This is not a playful UI.
- This is not consumer-facing.

The system should feel like a command console, not a social app.

---

## 2. Core UI Framework

The Control Center is built with **Next.js (App Router) + TypeScript** as the application framework and **Material UI (MUI) v5+** as the component library and design system base.

Next.js provides the routing, page structure, and minimal server-side endpoints. MUI provides the component library, theming, and visual language. Supabase provides authentication, data, and access control. These layers do not overlap.

**Requirements:**

- Use MUI components as the foundation
- Extend via theme customization, not custom overrides where avoidable
- Avoid mixing multiple UI libraries
- Prefer composition over custom reimplementation
- Limit global providers — keep the MUI ThemeProvider and Supabase session provider at the root, avoid layering unnecessary context providers

- No Tailwind.
- No custom CSS framework.
- No mixing UI kits.

Material UI is the design system base.

---

## 3. Theme Requirements

### 3.1 Theme Mode

Dark theme only (initially).

**Default background:**

- Deep charcoal / near-black
- Not pure black (avoid `#000000`)
- Prefer layered elevation with subtle contrast

### 3.2 Color Palette

Monochrome-first.

**Primary:**

- Neutral grayscale range
- Slight cool tone (optional subtle blue tint)

**Accent color:**

- Very minimal
- Used only for:
  - Active states
  - Selected items
  - Focus indicators
  - Key highlights

- No bright gradients.
- No neon.
- No marketing-style color splashes.

**Error, warning, success:**

- Muted versions
- Subtle
- Not aggressive

---

## 4. Typography

**Font:**

- System font stack or clean modern sans-serif
- No decorative fonts

**Hierarchy:**

- **H1:** Page title
- **H2:** Section title
- **H3:** Card / panel header
- **Body1:** Standard content
- **Body2:** Secondary content
- **Caption:** Metadata

**Text rules:**

- No oversized hero headers
- No flashy display text
- Clean, restrained typography
- Avoid excessive bold usage

---

## 5. Layout Principles

### 5.1 Structural Layout

**Primary layout pattern:**

- Persistent left sidebar
- Top header (optional per page)
- Main content panel
- Optional right-side contextual panel (future)

**Spacing:**

- 8px grid system
- Consistent internal padding
- No cramped layouts

### 5.2 Surfaces

Use MUI elevation levels sparingly.

**Hierarchy of surfaces:**

1. Page background
2. Primary content surface
3. Card / panel surface
4. Interactive surface (hover states)

- Avoid heavy shadows.
- Prefer subtle borders + tonal contrast.

---

## 6. Component Hierarchy

This is critical for consistency.

### Level 1 — Layout Components

- `AppShell`
- `Sidebar`
- `Header`
- `PageContainer`
- `SectionContainer`

These control structure only.

---

### Level 2 — Structural Containers

- `Card`
- `Panel`
- `Drawer`
- `Dialog`
- `Tabs`
- DataGrid container

These group related content.

---

### Level 3 — Functional Components

- `AgentCard`
- `TaskCard`
- `KanbanColumn`
- `ConversationThread`
- `UsageStatBlock`
- `StatusBadge`
- `PersonaEditorPanel`

These are domain-specific components.

---

### Level 4 — Primitive Components

- `Button`
- `IconButton`
- `Typography`
- `TextField`
- `Select`
- `Switch`
- `Chip`
- `Divider`
- `Tooltip`
- `Avatar`

Always use MUI primitives unless absolutely necessary.

---

## 7. Common UI Patterns

### 7.1 Agent Card

**Must display:**

- Agent name
- Role
- Status
- Persona version
- Assigned tasks count
- Last activity (future)
- Action buttons (View / Edit / Disable)

Consistent layout across all agents.

---

### 7.2 Task Card

**Must include:**

- Title
- Owner (Agent or Human)
- Priority
- Status
- Metadata (created date, project tag)
- Minimal content preview

No excessive decoration.

---

### 7.3 Kanban Columns

**Columns:**

- Backlog
- Ready
- In Progress
- Waiting
- Review
- Done

- Drag-and-drop supported.
- Subtle hover states.
- No flashy animations.

---

### 7.4 Status Indicators

Use muted color system:

- Active
- Idle
- Offline
- Disabled
- Error

Status must never rely on color alone.
Include icon + text.

---

## 8. Interaction Principles

- Fast response
- Minimal animation
- No playful micro-interactions
- Functional hover states
- Clear disabled states
- Strong focus outlines (accessibility)

This is operational software, not entertainment.

---

## 9. Iconography

**Use:**

- MUI Icons or similar clean line icon set
- Monochrome
- No emoji
- No cartoon illustrations in main UI

Agent avatars may be stylized, but core UI must remain clean.

---

## 10. Accessibility Requirements

- Sufficient contrast ratios
- Keyboard navigation support
- Clear focus states
- Semantic HTML where possible
- ARIA labels for interactive elements

This system must be usable by engineers under load.

---

## 11. What To Avoid

**Do NOT:**

- Add gradients
- Add marketing banners
- Use random accent colors
- Use inconsistent spacing
- Mix design languages
- Add unnecessary animations
- Over-style buttons
- Create custom components when MUI supports it

Consistency > Creativity.

---

## 12. Design System Ownership

All design decisions must:

- Align with this file
- Be documented in an ADR if deviating
- Maintain visual restraint
- Favor clarity over visual flair

---

## 13. One-Sentence Design Summary

FullThrottle AI's interface should feel like a modern, restrained command console built on Material UI, using a dark, monochrome system that prioritizes clarity, hierarchy, and operational focus over decoration.
