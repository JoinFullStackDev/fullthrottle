import type {
  AgentStatusValue,
  TaskStatusValue,
  TaskPriorityValue,
  OwnerTypeValue,
  UserRoleValue,
  OverrideScopeTypeValue,
  RiskToleranceValue,
  SenderTypeValue,
  ConversationChannelValue,
  IntegrationTypeValue,
  IntegrationStatusValue,
} from '../constants';

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  basePersonaVersion: string;
  status: AgentStatusValue;
  defaultModel: string;
  provider: string;
  runtimeAgentId: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentContext {
  id: string;
  agentId: string;
  key: string;
  value: string;
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
  metadata: Record<string, unknown>;
  parentTaskId: string | null;
  externalRef: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  agentId: string | null;
  agentIds?: string[];
  agentName?: string;
  agentNames?: string[];
  createdBy: string;
  channel: ConversationChannelValue;
  title: string | null;
  externalThreadId: string | null;
  externalChannelId: string | null;
  messageCount?: number;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: SenderTypeValue;
  senderName?: string;
  senderAvatarUrl?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  avatarUrl: string | null;
  invitedAt: string | null;
  onboardedAt: string | null;
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
  sourceType: string;
  externalId: string | null;
  integrationId: string | null;
  agentId: string | null;
  agentName?: string;
  folderTag: string | null;
  projectTag: string | null;
  contentHash: string | null;
  lastFetchedAt: string | null;
  lastModifiedAt: string | null;
  fetchStatus: string;
  refreshIntervalMinutes: number;
  mimeType: string | null;
  createdAt: string;
}

export interface KnowledgeContent {
  id: string;
  sourceId: string;
  content: string;
  chunkIndex: number;
  charCount: number;
  fetchedAt: string;
}

export interface Integration {
  id: string;
  type: IntegrationTypeValue;
  agentId: string | null;
  agentName?: string;
  status: IntegrationStatusValue;
  config: Record<string, unknown>;
  hasCredentials: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Docs feature
export interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;
  projectTag: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  children?: DocFolder[];
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  projectTag: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocFile {
  id: string;
  name: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  folderId: string | null;
  projectTag: string | null;
  createdBy: string;
  createdAt: string;
  publicUrl?: string;
}
