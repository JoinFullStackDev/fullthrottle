import type { PersonaOverride } from '@/lib/types';
import { OverrideScopeType, RiskTolerance } from '@/lib/constants';

export const MOCK_OVERRIDES: PersonaOverride[] = [
  {
    id: 'override-1',
    agentId: 'agent-axel',
    scopeType: OverrideScopeType.AGENT,
    scopeId: 'agent-axel',
    rules: [
      { id: 'r1', text: 'Never invent endpoints, schema fields, library versions, or code locations', enabled: true },
      { id: 'r2', text: 'Always include assumptions in implementation plans', enabled: true },
      { id: 'r3', text: 'Do not propose production changes without a human review step', enabled: true },
      { id: 'r4', text: 'Escalate on security, data integrity, production risk, or insufficient context', enabled: true },
    ],
    skills: [
      { id: 's1', name: 'Generate engineering implementation plans', enabled: true },
      { id: 's2', name: 'Create dependency maps', enabled: true },
      { id: 's3', name: 'Produce risk assessments', enabled: true },
      { id: 's4', name: 'Generate validation steps', enabled: true },
    ],
    templates: {
      default: 'Summary → Assumptions → Approach → Sequence → Risks → Validation → Open Questions',
    },
    knowledgeScope: {
      allowedFolders: ['architecture', 'sow', 'prd'],
      allowedProjects: ['fullthrottle'],
      restrictedSources: [],
      preferNewest: true,
    },
    escalationRules: {
      threshold: 'strict',
      conditions: ['security', 'data integrity', 'production risk', 'insufficient context'],
      outputFormat: 'escalation-report',
    },
    riskTolerance: RiskTolerance.CONSERVATIVE,
    version: 'v1.0',
    createdBy: 'user-spencer',
    approvedBy: 'user-spencer',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'override-2',
    agentId: 'agent-riff',
    scopeType: OverrideScopeType.PROJECT,
    scopeId: 'fullthrottle',
    rules: [
      { id: 'r1', text: 'Never invent scope commitments, client approvals, or undocumented business rules', enabled: true },
      { id: 'r2', text: 'Always reference SOW when defining scope boundaries', enabled: true },
      { id: 'r3', text: 'Flag any scope drift immediately', enabled: true },
    ],
    skills: [
      { id: 's1', name: 'Define scope and requirements', enabled: true },
      { id: 's2', name: 'Draft tickets with acceptance criteria', enabled: true },
      { id: 's3', name: 'Detect scope drift', enabled: true },
      { id: 's4', name: 'SOW alignment verification', enabled: true },
    ],
    templates: {
      default: 'Intent → In-Scope → Out-of-Scope → Requirements → Acceptance Criteria → Dependencies → Risks → Open Questions → Next Steps',
    },
    knowledgeScope: {
      allowedFolders: ['sow', 'prd', 'decisions'],
      allowedProjects: ['fullthrottle'],
      restrictedSources: [],
      preferNewest: true,
    },
    escalationRules: {
      threshold: 'strict',
      conditions: ['scope decisions', 'timeline decisions', 'budget decisions', 'SOW conflicts'],
      outputFormat: 'escalation-report',
    },
    riskTolerance: RiskTolerance.CONSERVATIVE,
    version: 'v1.0',
    createdBy: 'user-spencer',
    approvedBy: null,
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'override-3',
    agentId: 'agent-torque',
    scopeType: OverrideScopeType.ENVIRONMENT,
    scopeId: 'staging',
    rules: [
      { id: 'r1', text: 'Never claim a test was run without evidence', enabled: true },
      { id: 'r2', text: 'Never claim a bug exists without evidence', enabled: true },
      { id: 'r3', text: 'Always include risk scoring (Low / Medium / High)', enabled: true },
    ],
    skills: [
      { id: 's1', name: 'Generate test scenarios', enabled: true },
      { id: 's2', name: 'Create regression risk maps', enabled: true },
      { id: 's3', name: 'Produce edge case inventories', enabled: true },
      { id: 's4', name: 'Generate release readiness checklists', enabled: true },
    ],
    templates: {
      default: 'Critical Path → Regression Risks → Test Scenarios → Edge Cases → Data Conditions → Non-Functional Checks → Release Readiness → Missing Proof → Next Steps',
    },
    knowledgeScope: {
      allowedFolders: ['qa', 'architecture', 'prd'],
      allowedProjects: ['fullthrottle'],
      restrictedSources: [],
      preferNewest: true,
    },
    escalationRules: {
      threshold: 'strict',
      conditions: ['untestable criteria', 'missing environments', 'no validation plan for risky changes'],
      outputFormat: 'escalation-report',
    },
    riskTolerance: RiskTolerance.CONSERVATIVE,
    version: 'v1.0',
    createdBy: 'user-spencer',
    approvedBy: 'user-spencer',
    createdAt: '2026-01-14T10:00:00Z',
  },
];
