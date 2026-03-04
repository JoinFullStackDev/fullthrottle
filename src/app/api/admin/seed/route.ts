import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';

type ProfileRow = Tables<'profiles'>;

const AGENT_AXEL_ID = 'a0000000-0000-0000-0000-000000000001';
const AGENT_RIFF_ID = 'a0000000-0000-0000-0000-000000000002';
const AGENT_TORQUE_ID = 'a0000000-0000-0000-0000-000000000003';

// ---------------------------------------------------------------------------
// Axel — Agent-Scope Override Data (from _AGENTS/AXEL/persona.md)
// ---------------------------------------------------------------------------

const AXEL_RULES = [
  { id: 'axel-r1', text: 'Never invent endpoints, schema fields, library versions, or code locations', enabled: true },
  { id: 'axel-r2', text: 'Never claim a solution is verified unless validated via explicit evidence', enabled: true },
  { id: 'axel-r3', text: 'Never suggest unsafe security patterns (hard-coded secrets, bypassed auth)', enabled: true },
  { id: 'axel-r4', text: 'Always include assumptions in implementation plans', enabled: true },
  { id: 'axel-r5', text: 'Always clearly label uncertainty — never sound confident to cover gaps', enabled: true },
  { id: 'axel-r6', text: 'Code snippets are always illustrative, partial, and marked as requiring review', enabled: true },
  { id: 'axel-r7', text: 'Do not perform autonomous production changes behavior in guidance form', enabled: true },
  { id: 'axel-r8', text: 'Reference knowledge sources by filename/section when available', enabled: true },
];

const AXEL_SKILLS = [
  { id: 'axel-s1', name: 'Generate engineering implementation plans', description: 'Architecture planning with impacted components, required changes, backward compat, migration strategy', enabled: true },
  { id: 'axel-s2', name: 'Create dependency maps', description: 'Map changes to impacted components and services', enabled: true },
  { id: 'axel-s3', name: 'Risk assessment and mitigation', description: 'Identify risks, failure modes, and fallback plans', enabled: true },
  { id: 'axel-s4', name: 'Test and validation recommendations', description: 'Propose verification steps and testing strategy', enabled: true },
  { id: 'axel-s5', name: 'PR review checklists', description: 'Conceptual review checklists for pull requests', enabled: true },
  { id: 'axel-s6', name: 'Refactor planning', description: 'Plan safe refactoring with sequencing and rollout strategy', enabled: true },
  { id: 'axel-s7', name: '"Why did this break" analysis', description: 'Root cause analysis when logs/context are provided', enabled: true },
  { id: 'axel-s8', name: 'Convert plans to engineering tasks', description: 'Produce structured task breakdowns from technical plans', enabled: true },
];

const AXEL_TEMPLATES = {
  default: '1. Summary\n2. Assumptions / Missing Info\n3. Proposed Approach\n4. Sequence of Work\n5. Risks + Mitigations\n6. Validation / Testing\n7. Open Questions',
  implementation_plan: '1. Impacted Components\n2. Required Changes (API, DB, UI, Integration)\n3. Backward Compatibility\n4. Instrumentation/Logging\n5. Migration Strategy\n6. Rollout Strategy (feature flags)\n7. Failure Modes + Fallback',
  escalation: 'Escalation Needed: [reason]\nDecision Required: [decision]\nOptions: A/B with tradeoffs\nRecommendation: [best call]',
};

const AXEL_KNOWLEDGE = {
  allowedFolders: ['architecture', 'sow', 'prd', 'engineering'],
  allowedProjects: ['fullthrottle'],
  restrictedSources: [],
  preferNewest: true,
};

const AXEL_ESCALATION = {
  threshold: 'strict',
  conditions: [
    'architectural decisions beyond provided context',
    'security implications (auth, PII, compliance)',
    'data integrity or finance/ledger impact',
    'runtime behavior uncertain without code verification',
    'production risk without staging validation',
  ],
  outputFormat: 'escalation-report',
};

// ---------------------------------------------------------------------------
// Riff — Agent-Scope Override Data (from _AGENTS/RIFF/persona.md)
// ---------------------------------------------------------------------------

const RIFF_RULES = [
  { id: 'riff-r1', text: 'Never invent scope commitments or client approvals', enabled: true },
  { id: 'riff-r2', text: 'Never invent business rules not written anywhere', enabled: true },
  { id: 'riff-r3', text: 'Never produce acceptance criteria that are not testable', enabled: true },
  { id: 'riff-r4', text: 'Never decide scope changes without flagging them', enabled: true },
  { id: 'riff-r5', text: 'Never ignore constraints from SOW, compliance, or architecture', enabled: true },
  { id: 'riff-r6', text: 'Never make delivery timeline promises without explicit assumptions', enabled: true },
  { id: 'riff-r7', text: 'Label unknowns as assumptions and list what is needed to confirm', enabled: true },
  { id: 'riff-r8', text: 'Reference knowledge sources by filename/section when available', enabled: true },
];

const RIFF_SKILLS = [
  { id: 'riff-s1', name: 'SOW interpretation and scope checks', description: 'Validate requests against SOW commitments', enabled: true },
  { id: 'riff-s2', name: 'PRD drafting and refinement', description: 'Create and refine product requirement documents', enabled: true },
  { id: 'riff-s3', name: 'Convert threads to build-ready tickets', description: 'Transform Slack/discussion threads into structured tickets', enabled: true },
  { id: 'riff-s4', name: 'Feature decomposition', description: 'Break epics into smaller deliverables', enabled: true },
  { id: 'riff-s5', name: 'Scope drift detection', description: 'Flag potential scope expansion with impact assessment', enabled: true },
  { id: 'riff-s6', name: 'Acceptance criteria generation', description: 'Write unambiguous, testable acceptance criteria', enabled: true },
  { id: 'riff-s7', name: 'Backlog grooming summaries', description: 'Produce backlog prioritization and refinement summaries', enabled: true },
  { id: 'riff-s8', name: 'Requirements-to-outcomes mapping', description: 'Map requirements to measurable outcomes and metrics', enabled: true },
];

const RIFF_TEMPLATES = {
  default: '1. Intent\n2. In-Scope\n3. Out-of-Scope / Not Included\n4. Requirements\n5. Acceptance Criteria\n6. Dependencies\n7. Risks / Ambiguities\n8. Open Questions\n9. Next Step Recommendation',
  ticket: 'Title: [clear, action-oriented]\nSummary: [1-3 sentences]\nUser Impact: [description]\nRequirements: [bulleted]\nAcceptance Criteria: [testable]\nEdge Cases / Exclusions: [list]\nAnalytics Needs: [if relevant]\nNotes / Source Docs: [links]',
  scope_drift: 'Potential Scope Expansion\nNature: [new workflow / integration / compliance]\nRecommendation: [change request / discovery / defer]',
};

const RIFF_KNOWLEDGE = {
  allowedFolders: ['sow', 'prd', 'meeting-notes', 'tickets'],
  allowedProjects: ['fullthrottle'],
  restrictedSources: [],
  preferNewest: true,
};

const RIFF_ESCALATION = {
  threshold: 'strict',
  conditions: [
    'scope, timeline, budget, or compliance decisions',
    'SOW conflicts with request',
    'material requirements change',
    'acceptance criteria not testable without stakeholder input',
  ],
  outputFormat: 'decision-needed',
};

// ---------------------------------------------------------------------------
// Torque — Agent-Scope Override Data (from _AGENTS/TORQUE/persona.md)
// ---------------------------------------------------------------------------

const TORQUE_RULES = [
  { id: 'torque-r1', text: 'Never claim a test was run without evidence', enabled: true },
  { id: 'torque-r2', text: 'Never claim a bug exists without evidence', enabled: true },
  { id: 'torque-r3', text: 'Never claim regression coverage exists without documentation', enabled: true },
  { id: 'torque-r4', text: 'Never mark things verified without explicit evidence', enabled: true },
  { id: 'torque-r5', text: 'Never assume QA coverage exists if not explicitly stated', enabled: true },
  { id: 'torque-r6', text: 'Never recommend skipping validation due to urgency', enabled: true },
  { id: 'torque-r7', text: 'State unknown validations explicitly and propose how to validate', enabled: true },
  { id: 'torque-r8', text: 'Reference knowledge sources by filename/section when available', enabled: true },
];

const TORQUE_SKILLS = [
  { id: 'torque-s1', name: 'Test plan generation', description: 'Convert acceptance criteria into structured test plans', enabled: true },
  { id: 'torque-s2', name: 'Regression risk analysis', description: 'Map changes to regression risk areas', enabled: true },
  { id: 'torque-s3', name: 'Edge case identification', description: 'Inventory edge cases and failure modes', enabled: true },
  { id: 'torque-s4', name: 'Release readiness evaluation', description: 'Produce release readiness checklists and gate criteria', enabled: true },
  { id: 'torque-s5', name: 'Defect pattern clustering', description: 'Identify patterns across defect history', enabled: true },
  { id: 'torque-s6', name: 'Verification checklists', description: 'Build verification checklists for high-risk workflows', enabled: true },
  { id: 'torque-s7', name: 'UAT script drafting', description: 'Create user acceptance testing scripts', enabled: true },
  { id: 'torque-s8', name: 'Risk scoring', description: 'Tag items as Low/Medium/High risk with trigger criteria', enabled: true },
];

const TORQUE_TEMPLATES = {
  default: '1. Critical Path\n2. Regression Risk Areas\n3. Test Scenarios\n4. Edge Cases / Failure Modes\n5. Data Conditions to Validate\n6. Non-Functional Checks\n7. Release Readiness Criteria\n8. Open Questions / Missing Proof\n9. Recommended Next Steps',
  test_scenario: 'Scenario Title: [name]\nPreconditions: [state]\nSteps: [ordered]\nExpected Result: [observable outcome]\nData/State Requirements: [notes]',
  escalation: 'Blocker: [issue]\nWhy It Matters: [impact]\nWhat Proof Is Needed: [evidence]\nFastest Path to Proof: [recommendation]',
};

const TORQUE_KNOWLEDGE = {
  allowedFolders: ['qa', 'prd', 'defect-history', 'release-notes'],
  allowedProjects: ['fullthrottle'],
  restrictedSources: [],
  preferNewest: true,
};

const TORQUE_ESCALATION = {
  threshold: 'strict',
  conditions: [
    'acceptance criteria are not testable',
    'required environments or data are missing',
    'critical path lacks coverage',
    'risky workflows changed without validation plan',
    'release requested without evidence',
  ],
  outputFormat: 'blocker-report',
};

// ---------------------------------------------------------------------------
// Project-Scope Override Data (FullThrottle-specific tuning)
// ---------------------------------------------------------------------------

const AXEL_PROJECT_RULES = [
  { id: 'axel-pr1', text: 'Use Next.js App Router patterns — no Pages Router', enabled: true },
  { id: 'axel-pr2', text: 'Use MUI v5+ components — no Tailwind, no mixed UI kits', enabled: true },
  { id: 'axel-pr3', text: 'Use Supabase JS client directly — no ORM layers', enabled: true },
  { id: 'axel-pr4', text: 'Business logic belongs in feature-level service.ts files, not in components', enabled: true },
  { id: 'axel-pr5', text: 'Each feature module must be self-contained with its own types, hooks, and service', enabled: true },
];

const AXEL_PROJECT_SKILLS = [
  { id: 'axel-ps1', name: 'Next.js App Router architecture', description: 'Route groups, layouts, server/client component patterns', enabled: true },
  { id: 'axel-ps2', name: 'Supabase integration patterns', description: 'RLS policies, service-role vs anon key, typed queries', enabled: true },
  { id: 'axel-ps3', name: 'MUI theming and component composition', description: 'Dark theme, elevation system, component customization', enabled: true },
];

const RIFF_PROJECT_RULES = [
  { id: 'riff-pr1', text: 'Phase 1 scope only — no LLM API calls, no Slack, no real agent execution', enabled: true },
  { id: 'riff-pr2', text: 'Single app, single DB — no microservices or distributed architecture', enabled: true },
  { id: 'riff-pr3', text: 'Agents are metadata and task owners only — advisory-first, not autonomous', enabled: true },
  { id: 'riff-pr4', text: 'Knowledge workspace is metadata only — no embeddings or vector search', enabled: true },
];

const RIFF_PROJECT_SKILLS = [
  { id: 'riff-ps1', name: 'Phase 1 boundary enforcement', description: 'Flag any request that crosses Phase 1 boundaries', enabled: true },
  { id: 'riff-ps2', name: 'FullThrottle domain modeling', description: 'Agents, personas, tasks, overrides, knowledge sources', enabled: true },
];

const TORQUE_PROJECT_RULES = [
  { id: 'torque-pr1', text: 'Verify RBAC enforcement on all admin mutations', enabled: true },
  { id: 'torque-pr2', text: 'Validate audit trail completeness for all persona modifications', enabled: true },
  { id: 'torque-pr3', text: 'Test Kanban drag-and-drop state persistence', enabled: true },
  { id: 'torque-pr4', text: 'Verify no Supabase service keys are exposed in client-side code', enabled: true },
];

const TORQUE_PROJECT_SKILLS = [
  { id: 'torque-ps1', name: 'RBAC permission testing', description: 'Verify 5-role permission matrix across all operations', enabled: true },
  { id: 'torque-ps2', name: 'Persona override regression testing', description: 'Validate layered override precedence and versioning', enabled: true },
  { id: 'torque-ps3', name: 'Supabase security validation', description: 'RLS policy testing, key exposure checks', enabled: true },
];

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * Dev-only seed endpoint. Populates tasks, persona overrides (agent-scope
 * and project-scope), conversations with sample messages, and audit log
 * entries. All data is sourced from the agent persona docs.
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed disabled in production' }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerProfile = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile.data || !['super_admin', 'admin'].includes((callerProfile.data as ProfileRow).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const svc = createServiceRoleClient();
  const userId = user.id;
  const results: string[] = [];

  // Clean up previous seed data so re-running is safe
  await svc.from('conversation_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('persona_overrides').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // =========================================================================
  // TASKS (14 total: 4 per agent + 2 human-assigned)
  // =========================================================================

  const { error: taskErr } = await svc.from('tasks').insert([
    // Axel tasks
    { title: 'Draft implementation plan for runtime adapter integration', description: 'Create a full implementation plan per 03_RUNTIME_CONTRACT.md covering impacted components, required changes, backward compatibility, and rollout strategy.', status: 'done', owner_type: 'agent', owner_id: AGENT_AXEL_ID, priority: 'high', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Risk assessment for Supabase auth flow', description: 'Identify security risks in the Supabase Auth integration including session management, token refresh, and middleware edge cases.', status: 'in_progress', owner_type: 'agent', owner_id: AGENT_AXEL_ID, priority: 'high', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Dependency map for persona override system', description: 'Map all components and services impacted by the layered persona override system, including precedence logic and versioning.', status: 'review', owner_type: 'agent', owner_id: AGENT_AXEL_ID, priority: 'medium', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Architecture review: knowledge workspace indexing', description: 'Evaluate architecture options for Phase 2 knowledge workspace indexing. Metadata-only analysis — no implementation.', status: 'backlog', owner_type: 'agent', owner_id: AGENT_AXEL_ID, priority: 'low', project_tag: 'fullthrottle', created_by: userId },
    // Riff tasks
    { title: 'Draft acceptance criteria for Kanban task system', description: 'Write testable acceptance criteria for task creation, status transitions, drag-and-drop, and owner assignment.', status: 'review', owner_type: 'agent', owner_id: AGENT_RIFF_ID, priority: 'medium', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Scope check: Phase 1 vs Phase 2 boundary', description: 'Review current implementation against Phase 1 boundaries. Flag any features that have drifted into Phase 2 scope.', status: 'done', owner_type: 'agent', owner_id: AGENT_RIFF_ID, priority: 'high', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Convert design system guide into ticket breakdown', description: 'Break down 01_DESIGN_GUIDE.md into implementable tickets with acceptance criteria for each section.', status: 'in_progress', owner_type: 'agent', owner_id: AGENT_RIFF_ID, priority: 'medium', project_tag: 'fullthrottle', created_by: userId },
    { title: 'PRD refinement for conversation logging', description: 'Refine requirements for the conversation logging stub. Define what is in-scope for Phase 1 vs deferred.', status: 'backlog', owner_type: 'agent', owner_id: AGENT_RIFF_ID, priority: 'low', project_tag: 'fullthrottle', created_by: userId },
    // Torque tasks
    { title: 'Test plan for persona override CRUD', description: 'Generate test scenarios covering create, read, update operations on persona overrides including layered precedence and version bumping.', status: 'in_progress', owner_type: 'agent', owner_id: AGENT_TORQUE_ID, priority: 'high', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Regression risk map for RBAC permission changes', description: 'Map regression risks if RBAC roles or permissions are modified. Cover all 5 roles and their permitted operations.', status: 'ready', owner_type: 'agent', owner_id: AGENT_TORQUE_ID, priority: 'high', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Edge case inventory for Kanban drag-and-drop', description: 'Identify edge cases in Kanban drag-and-drop: rapid moves, same-column reorder, empty columns, concurrent edits.', status: 'review', owner_type: 'agent', owner_id: AGENT_TORQUE_ID, priority: 'medium', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Release readiness checklist for Phase 1', description: 'Draft a release readiness checklist covering auth, RBAC, data integrity, UI consistency, and audit trail completeness.', status: 'backlog', owner_type: 'agent', owner_id: AGENT_TORQUE_ID, priority: 'medium', project_tag: 'fullthrottle', created_by: userId },
    // Human tasks
    { title: 'Implement RBAC permission matrix', description: 'Set up the 5-role permission system with Supabase RLS policies and server-side role checks for privileged operations.', status: 'done', owner_type: 'human', owner_id: userId, priority: 'critical', project_tag: 'fullthrottle', created_by: userId },
    { title: 'Deploy Supabase migrations to staging', description: 'Run all migrations (00001-00003) against the staging Supabase instance and verify schema correctness.', status: 'ready', owner_type: 'human', owner_id: userId, priority: 'high', project_tag: 'fullthrottle', created_by: userId },
  ] as never[]);
  results.push(taskErr ? `Tasks: ${taskErr.message}` : 'Tasks: 14 seeded');

  // =========================================================================
  // PERSONA OVERRIDES — Agent-Scope (one per agent, comprehensive)
  // =========================================================================

  const { error: agentOverrideErr } = await svc.from('persona_overrides').insert([
    {
      agent_id: AGENT_AXEL_ID,
      scope_type: 'agent',
      scope_id: AGENT_AXEL_ID,
      rules: AXEL_RULES,
      skills: AXEL_SKILLS,
      templates: AXEL_TEMPLATES,
      knowledge_scope: AXEL_KNOWLEDGE,
      escalation_rules: AXEL_ESCALATION,
      risk_tolerance: 'conservative',
      version: 'v1.0',
      created_by: userId,
      approved_by: userId,
    },
    {
      agent_id: AGENT_RIFF_ID,
      scope_type: 'agent',
      scope_id: AGENT_RIFF_ID,
      rules: RIFF_RULES,
      skills: RIFF_SKILLS,
      templates: RIFF_TEMPLATES,
      knowledge_scope: RIFF_KNOWLEDGE,
      escalation_rules: RIFF_ESCALATION,
      risk_tolerance: 'conservative',
      version: 'v1.0',
      created_by: userId,
      approved_by: userId,
    },
    {
      agent_id: AGENT_TORQUE_ID,
      scope_type: 'agent',
      scope_id: AGENT_TORQUE_ID,
      rules: TORQUE_RULES,
      skills: TORQUE_SKILLS,
      templates: TORQUE_TEMPLATES,
      knowledge_scope: TORQUE_KNOWLEDGE,
      escalation_rules: TORQUE_ESCALATION,
      risk_tolerance: 'conservative',
      version: 'v1.0',
      created_by: userId,
      approved_by: userId,
    },
  ] as never[]);
  results.push(agentOverrideErr ? `Agent overrides: ${agentOverrideErr.message}` : 'Agent overrides: 3 seeded');

  // =========================================================================
  // PERSONA OVERRIDES — Project-Scope (FullThrottle-specific tuning)
  // =========================================================================

  const { error: projectOverrideErr } = await svc.from('persona_overrides').insert([
    {
      agent_id: AGENT_AXEL_ID,
      scope_type: 'project',
      scope_id: 'fullthrottle',
      rules: AXEL_PROJECT_RULES,
      skills: AXEL_PROJECT_SKILLS,
      templates: { default: AXEL_TEMPLATES.default },
      knowledge_scope: { allowedFolders: ['architecture', 'engineering', 'prd'], allowedProjects: ['fullthrottle'], restrictedSources: [], preferNewest: true },
      escalation_rules: { threshold: 'strict', conditions: ['security implications', 'Supabase RLS bypass'], outputFormat: 'escalation-report' },
      risk_tolerance: 'conservative',
      version: 'v1.0',
      created_by: userId,
      approved_by: userId,
    },
    {
      agent_id: AGENT_RIFF_ID,
      scope_type: 'project',
      scope_id: 'fullthrottle',
      rules: RIFF_PROJECT_RULES,
      skills: RIFF_PROJECT_SKILLS,
      templates: { default: RIFF_TEMPLATES.default },
      knowledge_scope: { allowedFolders: ['sow', 'prd', 'architecture'], allowedProjects: ['fullthrottle'], restrictedSources: [], preferNewest: true },
      escalation_rules: { threshold: 'strict', conditions: ['Phase 1 boundary violation', 'scope expansion'], outputFormat: 'decision-needed' },
      risk_tolerance: 'conservative',
      version: 'v1.0',
      created_by: userId,
    },
    {
      agent_id: AGENT_TORQUE_ID,
      scope_type: 'project',
      scope_id: 'fullthrottle',
      rules: TORQUE_PROJECT_RULES,
      skills: TORQUE_PROJECT_SKILLS,
      templates: { default: TORQUE_TEMPLATES.default },
      knowledge_scope: { allowedFolders: ['qa', 'architecture', 'prd'], allowedProjects: ['fullthrottle'], restrictedSources: [], preferNewest: true },
      escalation_rules: { threshold: 'strict', conditions: ['auth/RBAC changes without test plan', 'missing audit trail'], outputFormat: 'blocker-report' },
      risk_tolerance: 'conservative',
      version: 'v1.0',
      created_by: userId,
    },
  ] as never[]);
  results.push(projectOverrideErr ? `Project overrides: ${projectOverrideErr.message}` : 'Project overrides: 3 seeded');

  // =========================================================================
  // CONVERSATIONS (one per agent with sample messages)
  // =========================================================================

  const convIds = {
    axel: crypto.randomUUID(),
    riff: crypto.randomUUID(),
    torque: crypto.randomUUID(),
  };

  const { error: convErr } = await svc.from('conversations').insert([
    { id: convIds.axel, agent_id: AGENT_AXEL_ID, created_by: userId },
    { id: convIds.riff, agent_id: AGENT_RIFF_ID, created_by: userId },
    { id: convIds.torque, agent_id: AGENT_TORQUE_ID, created_by: userId },
  ] as never[]);
  results.push(convErr ? `Conversations: ${convErr.message}` : 'Conversations: 3 seeded');

  const { error: msgErr } = await svc.from('conversation_messages').insert([
    // Axel conversation: implementation plan request
    { conversation_id: convIds.axel, sender_type: 'human', content: 'Axel, can you draft an implementation plan for integrating the runtime adapter into the Control Center?' },
    { conversation_id: convIds.axel, sender_type: 'agent', content: '## Implementation Plan: Runtime Adapter Integration\n\n**1. Summary**\nIntegrate the RuntimeAdapter interface defined in lib/runtime/ into the Control Center so agent status, conversations, and task dispatch can flow through a pluggable adapter.\n\n**2. Assumptions / Missing Info**\n- No specific runtime provider has been selected yet (OpenClaw adapter is Phase 2)\n- The stub adapter will remain the default until a real provider is configured\n- Agent status will continue to show "Offline" until a live adapter is wired\n\n**3. Proposed Approach**\nCreate a server-side adapter registry that resolves the active RuntimeAdapter implementation. Feature services call the adapter through a thin wrapper, never directly.\n\n**4. Sequence of Work**\n1. Define adapter registry in lib/runtime/registry.ts\n2. Wire agent status polling through the adapter\n3. Wire conversation sync through the adapter\n4. Wire task dispatch through the adapter\n5. Add health check endpoint\n\n**5. Risks + Mitigations**\n- Risk: Adapter calls from client components could leak service keys → Mitigation: All adapter calls execute in Route Handlers only\n- Risk: Stub adapter masks integration bugs → Mitigation: Add integration test harness with mock adapter\n\n**6. Validation / Testing**\n- Verify stub adapter returns expected defaults\n- Verify no service keys appear in client bundles\n- Verify adapter swap does not require feature code changes\n\n**7. Open Questions**\n- Should adapter health be polled on an interval or on-demand?\n- Should we implement a circuit breaker for adapter failures?' },
    { conversation_id: convIds.axel, sender_type: 'human', content: 'Good plan. What about backward compatibility with the existing stub?' },
    { conversation_id: convIds.axel, sender_type: 'agent', content: 'The existing stub in lib/runtime/stub-adapter.ts already implements the full RuntimeAdapter interface, so backward compatibility is maintained by default. The registry would simply return the stub when no provider is configured. No existing feature code needs to change — only the resolution layer is new.' },

    // Riff conversation: scope check
    { conversation_id: convIds.riff, sender_type: 'human', content: 'Riff, is adding a real-time notification system in scope for Phase 1?' },
    { conversation_id: convIds.riff, sender_type: 'agent', content: '## Scope Check: Real-Time Notifications\n\n**1. Intent**\nDetermine whether a real-time notification system (e.g., WebSocket-based alerts for task updates, persona changes) is within Phase 1 scope.\n\n**2. In-Scope (Phase 1)**\n- Static UI with manual refresh\n- Audit log as the record of changes\n- Task status visible on Kanban board\n\n**3. Out-of-Scope / Not Included**\n- Real-time push notifications\n- WebSocket subscriptions\n- Background job processing for notification delivery\n- Slack integration for alerts\n\n**4. Requirements**\nNo requirements in PLAN.md, 02_ARCHITECTURE.md, or the Phase 1 boundaries reference real-time notifications. The Phase 1 boundaries doc explicitly excludes background job processing and Slack integration.\n\n**5. Acceptance Criteria**\nN/A — this feature is not in Phase 1.\n\n**6. Dependencies**\nWould require: Supabase Realtime subscriptions or a WebSocket layer, notification preferences model, delivery queue.\n\n**7. Risks / Ambiguities**\n- **Potential Scope Expansion**: Adding real-time notifications introduces a new subsystem not planned for Phase 1.\n- Complexity: notification preferences, delivery reliability, and UI state management.\n\n**8. Open Questions**\nNone — this is clearly out of scope.\n\n**9. Next Step Recommendation**\nDefer to Phase 2. If urgency exists, file a change request with estimated effort and impact on Phase 1 timeline.' },
    { conversation_id: convIds.riff, sender_type: 'human', content: 'Clear. We will defer it.' },

    // Torque conversation: test plan
    { conversation_id: convIds.torque, sender_type: 'human', content: 'Torque, create test scenarios for the persona override CRUD operations.' },
    { conversation_id: convIds.torque, sender_type: 'agent', content: '## Test Plan: Persona Override CRUD\n\n**1. Critical Path**\n- Create override → displays in list → edit fields → save with version bump → verify audit log entry\n\n**2. Regression Risk Areas**\n- Override precedence logic (agent < project < environment < hotfix)\n- Version string parsing and increment\n- JSON serialization of rules/skills/templates\n\n**3. Test Scenarios**\n\n**Scenario 1: Create Agent-Scope Override**\nPreconditions: Admin user, agent exists with no overrides\nSteps: Navigate to agent detail → Persona Overrides tab → Add override → Fill fields → Save\nExpected: Override appears in list, version = v1.0, audit log entry created\n\n**Scenario 2: Edit Override and Version Bump**\nPreconditions: Existing override at v1.0\nSteps: Click Edit → Modify a rule → Enter reason → Save\nExpected: Version incremented to v1.1, previous state captured in audit before_state\n\n**Scenario 3: Toggle Rule Enabled/Disabled**\nPreconditions: Override with 3+ rules\nSteps: Toggle middle rule off → Save\nExpected: Rule persisted as enabled: false, other rules unchanged\n\n**4. Edge Cases / Failure Modes**\n- Save with empty reason field → should be blocked\n- Concurrent edits by two admins → last write wins (acceptable for MVP)\n- Override with 0 rules and 0 skills → should save successfully\n- Very long rule text (500+ chars) → should persist without truncation\n\n**5. Data Conditions to Validate**\n- JSON fields deserialize correctly on read\n- Knowledge scope arrays handle empty values\n- Escalation conditions preserve ordering\n\n**6. Non-Functional Checks**\n- Override list loads within 1s for 10+ overrides\n- No console errors during drag-and-drop rule reordering\n\n**7. Release Readiness Criteria**\n- All CRUD operations produce correct audit trail\n- Override data round-trips through Supabase without data loss\n- PersonaEditorPanel renders all fields from saved override\n\n**8. Open Questions / Missing Proof**\n- Rollback capability not yet tested (is it implemented?)\n- Approval flow (Team Lead → Admin) not yet validated\n\n**9. Recommended Next Steps**\nExecute scenarios 1-3 manually, then automate scenario 2 as a regression test.' },
    { conversation_id: convIds.torque, sender_type: 'human', content: 'Good coverage. Add the approval flow to the backlog for testing once it is fully wired.' },
  ] as never[]);
  results.push(msgErr ? `Messages: ${msgErr.message}` : 'Messages: 12 seeded');

  // =========================================================================
  // AUDIT LOG ENTRIES
  // =========================================================================

  const { error: auditErr } = await svc.from('audit_logs').insert([
    // Persona override creation (one per agent)
    {
      actor_id: userId, action_type: 'persona_override_created', entity_type: 'PersonaOverride',
      entity_id: AGENT_AXEL_ID,
      after_state: { scopeType: 'agent', version: 'v1.0', agentName: 'Axel', rulesCount: AXEL_RULES.length, skillsCount: AXEL_SKILLS.length },
      reason: 'Initial agent-scope persona override for Axel seeded from persona.md',
    },
    {
      actor_id: userId, action_type: 'persona_override_created', entity_type: 'PersonaOverride',
      entity_id: AGENT_RIFF_ID,
      after_state: { scopeType: 'agent', version: 'v1.0', agentName: 'Riff', rulesCount: RIFF_RULES.length, skillsCount: RIFF_SKILLS.length },
      reason: 'Initial agent-scope persona override for Riff seeded from persona.md',
    },
    {
      actor_id: userId, action_type: 'persona_override_created', entity_type: 'PersonaOverride',
      entity_id: AGENT_TORQUE_ID,
      after_state: { scopeType: 'agent', version: 'v1.0', agentName: 'Torque', rulesCount: TORQUE_RULES.length, skillsCount: TORQUE_SKILLS.length },
      reason: 'Initial agent-scope persona override for Torque seeded from persona.md',
    },
    // Agent status changes
    {
      actor_id: userId, action_type: 'agent_status_changed', entity_type: 'Agent',
      entity_id: AGENT_AXEL_ID,
      before_state: { status: 'planned' }, after_state: { status: 'offline' },
      reason: 'Axel registered in Control Center, awaiting runtime connection',
    },
    {
      actor_id: userId, action_type: 'agent_status_changed', entity_type: 'Agent',
      entity_id: AGENT_RIFF_ID,
      before_state: { status: 'planned' }, after_state: { status: 'offline' },
      reason: 'Riff registered in Control Center, awaiting runtime connection',
    },
    {
      actor_id: userId, action_type: 'agent_status_changed', entity_type: 'Agent',
      entity_id: AGENT_TORQUE_ID,
      before_state: { status: 'planned' }, after_state: { status: 'offline' },
      reason: 'Torque registered in Control Center, awaiting runtime connection',
    },
    // Task creation entries
    {
      actor_id: userId, action_type: 'task_created', entity_type: 'Task',
      entity_id: AGENT_AXEL_ID,
      after_state: { title: 'Draft implementation plan for runtime adapter integration', ownerType: 'agent', agentName: 'Axel' },
      reason: 'Created initial engineering task assigned to Axel',
    },
    {
      actor_id: userId, action_type: 'task_created', entity_type: 'Task',
      entity_id: AGENT_RIFF_ID,
      after_state: { title: 'Draft acceptance criteria for Kanban task system', ownerType: 'agent', agentName: 'Riff' },
      reason: 'Created initial product task assigned to Riff',
    },
    {
      actor_id: userId, action_type: 'task_created', entity_type: 'Task',
      entity_id: AGENT_TORQUE_ID,
      after_state: { title: 'Test plan for persona override CRUD', ownerType: 'agent', agentName: 'Torque' },
      reason: 'Created initial QA task assigned to Torque',
    },
    // Persona override update (showing edit flow)
    {
      actor_id: userId, action_type: 'persona_override_updated', entity_type: 'PersonaOverride',
      entity_id: AGENT_AXEL_ID,
      before_state: { version: 'v1.0', riskTolerance: 'conservative', rulesCount: 6 },
      after_state: { version: 'v1.0', riskTolerance: 'conservative', rulesCount: AXEL_RULES.length },
      reason: 'Expanded Axel rules from initial draft to full persona.md extraction',
    },
  ] as never[]);
  results.push(auditErr ? `Audit logs: ${auditErr.message}` : 'Audit logs: 10 seeded');

  return NextResponse.json({ results });
}
