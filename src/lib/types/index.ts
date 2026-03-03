import type {
  AgentStatusValue,
  TaskStatusValue,
  TaskPriorityValue,
  OwnerTypeValue,
  UserRoleValue,
  OverrideScopeTypeValue,
  RiskToleranceValue,
  SenderTypeValue,
} from '../constants';

export interface Agent {
  id: string;
  name: string;
  role: string;
  basePersonaVersion: string;
  status: AgentStatusValue;
  defaultModel: string;
  runtimeAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaRule {
  id: string;
  text: string;
  enabled: boolean;
}

export interface PersonaSkill {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface KnowledgeScopeConfig {
  allowedFolders: string[];
  allowedProjects: string[];
  restrictedSources: string[];
  preferNewest: boolean;
}

export interface EscalationConfig {
  threshold: 'strict' | 'flexible';
  conditions: string[];
  outputFormat: string;
}

export interface PersonaOverride {
  id: string;
  agentId: string;
  scopeType: OverrideScopeTypeValue;
  scopeId: string;
  rules: PersonaRule[];
  skills: PersonaSkill[];
  templates: Record<string, string>;
  knowledgeScope: KnowledgeScopeConfig;
  escalationRules: EscalationConfig;
  riskTolerance: RiskToleranceValue;
  version: string;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  ownerType: OwnerTypeValue;
  ownerId: string;
  priority: TaskPriorityValue;
  projectTag: string;
  runtimeRunId: string | null;
  lastRuntimeStatus: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  agentName?: string;
  createdBy: string;
  messageCount?: number;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: SenderTypeValue;
  senderName?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  reason: string;
  timestamp: string;
}

export interface UsageEvent {
  id: string;
  agentId: string;
  model: string;
  tokenCount: number;
  costEstimate: number;
  timestamp: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: string;
  path: string;
  createdAt: string;
}
