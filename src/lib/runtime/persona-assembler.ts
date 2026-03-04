import fs from 'fs';
import path from 'path';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import type { PersonaRule, PersonaSkill, KnowledgeScopeConfig, EscalationConfig } from '@/lib/types';

type AgentRow = Tables<'agents'>;
type OverrideRow = Tables<'persona_overrides'>;
type TaskRow = Tables<'tasks'>;

const SCOPE_PRECEDENCE: Record<string, number> = {
  hotfix: 4,
  environment: 3,
  project: 2,
  agent: 1,
};

function loadBasePersona(agentName: string): string {
  const personaPath = path.join(
    process.cwd(),
    'docs',
    '_AGENTS',
    agentName.toUpperCase(),
    'persona.md',
  );

  try {
    return fs.readFileSync(personaPath, 'utf-8');
  } catch {
    return `No base persona found for ${agentName}.`;
  }
}

async function getActiveOverrides(agentId: string): Promise<OverrideRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('persona_overrides')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load overrides: ${error.message}`);
  return (data ?? []) as OverrideRow[];
}

async function getAssignedTasks(agentId: string): Promise<TaskRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('owner_type', 'agent')
    .eq('owner_id', agentId)
    .order('updated_at', { ascending: false })
    .limit(25);

  if (error) return [];
  return (data ?? []) as TaskRow[];
}

function mergeOverrides(overrides: OverrideRow[]) {
  const sorted = [...overrides].sort(
    (a, b) => (SCOPE_PRECEDENCE[b.scope_type] ?? 0) - (SCOPE_PRECEDENCE[a.scope_type] ?? 0),
  );

  const mergedRules: PersonaRule[] = [];
  const mergedSkills: PersonaSkill[] = [];
  const mergedTemplates: Record<string, string> = {};
  let riskTolerance = 'conservative';
  let knowledgeScope: KnowledgeScopeConfig | null = null;
  let escalationRules: EscalationConfig | null = null;
  const seenRuleIds = new Set<string>();
  const seenSkillIds = new Set<string>();

  for (const override of sorted) {
    const rules = (override.rules ?? []) as unknown as PersonaRule[];
    for (const rule of rules) {
      if (!seenRuleIds.has(rule.id)) {
        seenRuleIds.add(rule.id);
        mergedRules.push(rule);
      }
    }

    const skills = (override.skills ?? []) as unknown as PersonaSkill[];
    for (const skill of skills) {
      if (!seenSkillIds.has(skill.id)) {
        seenSkillIds.add(skill.id);
        mergedSkills.push(skill);
      }
    }

    const templates = (override.templates ?? {}) as Record<string, string>;
    for (const [key, value] of Object.entries(templates)) {
      if (!mergedTemplates[key]) {
        mergedTemplates[key] = value;
      }
    }

    riskTolerance = override.risk_tolerance ?? riskTolerance;

    if (!knowledgeScope && override.knowledge_scope) {
      const ks = override.knowledge_scope as unknown as KnowledgeScopeConfig;
      if (ks.allowedFolders?.length || ks.allowedProjects?.length) {
        knowledgeScope = ks;
      }
    }

    if (!escalationRules && override.escalation_rules) {
      const er = override.escalation_rules as unknown as EscalationConfig;
      if (er.conditions?.length) {
        escalationRules = er;
      }
    }
  }

  return { mergedRules, mergedSkills, mergedTemplates, riskTolerance, knowledgeScope, escalationRules };
}

const STATUS_LABELS: Record<string, string> = {
  offline: 'Offline',
  active: 'Active',
  disabled: 'Disabled',
  planned: 'Planned',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export interface AssembledPrompt {
  systemPrompt: string;
  knowledgeScope: KnowledgeScopeConfig | null;
}

export async function assembleSystemPrompt(
  agentId: string,
  agentName: string,
  agentRole: string,
  agent?: AgentRow,
): Promise<AssembledPrompt> {
  const basePersona = loadBasePersona(agentName);
  const [overrides, tasks] = await Promise.all([
    getActiveOverrides(agentId),
    getAssignedTasks(agentId),
  ]);
  const {
    mergedRules,
    mergedSkills,
    mergedTemplates,
    riskTolerance,
    knowledgeScope,
    escalationRules,
  } = mergeOverrides(overrides);

  const sections: string[] = [];

  // --- Identity ---
  sections.push(
    `You are ${agentName}, the ${agentRole} agent at FullStack.`,
    `You are part of the FullThrottle AI operations team.`,
    '',
  );

  // --- Agent overview ---
  if (agent) {
    sections.push('## Your Agent Profile', '');
    sections.push(`- Name: ${agent.name}`);
    sections.push(`- Role: ${agent.role}`);
    if (agent.description) {
      sections.push(`- Description: ${agent.description}`);
    }
    sections.push(`- Status: ${STATUS_LABELS[agent.status] ?? agent.status}`);
    sections.push(`- Provider: ${agent.provider}`);
    sections.push(`- Model: ${agent.default_model}`);
    sections.push(`- Persona Version: ${agent.base_persona_version}`);
    sections.push('');
  }

  // --- Base persona ---
  sections.push('## Base Persona', '', basePersona, '');

  // --- Rules ---
  const enabledRules = mergedRules.filter((r) => r.enabled);
  if (enabledRules.length > 0) {
    sections.push('## Active Rules', '');
    for (const rule of enabledRules) {
      sections.push(`- ${rule.text}`);
    }
    sections.push('');
  }

  // --- Skills ---
  const enabledSkills = mergedSkills.filter((s) => s.enabled);
  if (enabledSkills.length > 0) {
    sections.push('## Active Skills', '');
    for (const skill of enabledSkills) {
      sections.push(`- ${skill.name}${skill.description ? `: ${skill.description}` : ''}`);
    }
    sections.push('');
  }

  // --- Templates ---
  const templateKeys = Object.keys(mergedTemplates);
  if (templateKeys.length > 0) {
    sections.push('## Output Templates', '');
    sections.push('When producing output, use these templates where applicable:', '');
    for (const [key, value] of Object.entries(mergedTemplates)) {
      sections.push(`### ${key}`, '', value, '');
    }
  }

  // --- Risk tolerance ---
  sections.push(`## Risk Tolerance: ${riskTolerance}`, '');

  // --- Escalation ---
  if (escalationRules) {
    sections.push('## Escalation Rules', '');
    sections.push(`- Threshold: ${escalationRules.threshold}`);
    if (escalationRules.conditions?.length) {
      sections.push(`- Conditions: ${escalationRules.conditions.join(', ')}`);
    }
    if (escalationRules.outputFormat) {
      sections.push(`- Output Format: ${escalationRules.outputFormat}`);
    }
    sections.push('');
  }

  // --- Knowledge scope ---
  if (knowledgeScope) {
    sections.push('## Knowledge Scope', '');
    if (knowledgeScope.allowedFolders?.length) {
      sections.push(`- Allowed folders: ${knowledgeScope.allowedFolders.join(', ')}`);
    }
    if (knowledgeScope.allowedProjects?.length) {
      sections.push(`- Allowed projects: ${knowledgeScope.allowedProjects.join(', ')}`);
    }
    if (knowledgeScope.restrictedSources?.length) {
      sections.push(`- Restricted sources: ${knowledgeScope.restrictedSources.join(', ')}`);
    }
    sections.push('');
  }

  // --- Assigned tasks ---
  if (tasks.length > 0) {
    sections.push('## Your Assigned Tasks', '');
    sections.push('These are the tasks currently assigned to you. Be aware of them and reference them when relevant to the conversation.', '');

    const activeTasks = tasks.filter((t) => t.status !== 'done');
    const doneTasks = tasks.filter((t) => t.status === 'done');

    if (activeTasks.length > 0) {
      sections.push('### Active Tasks', '');
      for (const task of activeTasks) {
        sections.push(
          `- **${task.title}** [${TASK_STATUS_LABELS[task.status] ?? task.status}] [${PRIORITY_LABELS[task.priority] ?? task.priority}]` +
            (task.project_tag ? ` (${task.project_tag})` : '') +
            (task.description ? `\n  ${task.description}` : ''),
        );
      }
      sections.push('');
    }

    if (doneTasks.length > 0) {
      sections.push(`### Recently Completed Tasks (${doneTasks.length})`, '');
      for (const task of doneTasks.slice(0, 5)) {
        sections.push(
          `- ~~${task.title}~~` + (task.project_tag ? ` (${task.project_tag})` : ''),
        );
      }
      sections.push('');
    }
  }

  // --- Override metadata ---
  if (overrides.length > 0) {
    sections.push('## Active Persona Overrides', '');
    sections.push('The following persona overrides are currently applied to your configuration:', '');
    for (const override of overrides) {
      const rulesCount = ((override.rules ?? []) as unknown as PersonaRule[]).filter((r) => r.enabled).length;
      const skillsCount = ((override.skills ?? []) as unknown as PersonaSkill[]).filter((s) => s.enabled).length;
      sections.push(
        `- **${override.scope_type}** scope (${override.scope_id}) — v${override.version} — ${rulesCount} rules, ${skillsCount} skills, risk: ${override.risk_tolerance}` +
          (override.approved_by ? ' [Approved]' : ' [Pending approval]'),
      );
    }
    sections.push('');
  }

  return {
    systemPrompt: sections.join('\n'),
    knowledgeScope,
  };
}
