export const AgentStatus = {
  OFFLINE: 'offline',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  PLANNED: 'planned',
} as const;
export type AgentStatusValue = (typeof AgentStatus)[keyof typeof AgentStatus];

export const TaskStatus = {
  BACKLOG: 'backlog',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  WAITING: 'waiting',
  REVIEW: 'review',
  DONE: 'done',
} as const;
export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.READY]: 'Ready',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.WAITING]: 'Waiting',
  [TaskStatus.REVIEW]: 'Review',
  [TaskStatus.DONE]: 'Done',
};

export const KANBAN_COLUMN_ORDER: TaskStatusValue[] = [
  TaskStatus.BACKLOG,
  TaskStatus.READY,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type TaskPriorityValue = (typeof TaskPriority)[keyof typeof TaskPriority];

export const PRIORITY_LABELS: Record<TaskPriorityValue, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.CRITICAL]: 'Critical',
};

export const OwnerType = {
  HUMAN: 'human',
  AGENT: 'agent',
} as const;
export type OwnerTypeValue = (typeof OwnerType)[keyof typeof OwnerType];

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TEAM_LEAD: 'team_lead',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;
export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_LABELS: Record<UserRoleValue, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.TEAM_LEAD]: 'Team Lead',
  [UserRole.CONTRIBUTOR]: 'Contributor',
  [UserRole.VIEWER]: 'Viewer',
};

export const OverrideScopeType = {
  AGENT: 'agent',
  PROJECT: 'project',
  ENVIRONMENT: 'environment',
  HOTFIX: 'hotfix',
} as const;
export type OverrideScopeTypeValue = (typeof OverrideScopeType)[keyof typeof OverrideScopeType];

export const RiskTolerance = {
  CONSERVATIVE: 'conservative',
  BALANCED: 'balanced',
  AGGRESSIVE: 'aggressive',
} as const;
export type RiskToleranceValue = (typeof RiskTolerance)[keyof typeof RiskTolerance];

export const SenderType = {
  HUMAN: 'human',
  AGENT: 'agent',
  SYSTEM: 'system',
} as const;
export type SenderTypeValue = (typeof SenderType)[keyof typeof SenderType];
