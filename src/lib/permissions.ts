import type { UserRoleValue } from './constants';

export type Action =
  | 'view'
  | 'create_task'
  | 'edit_task'
  | 'assign_task'
  | 'edit_persona'
  | 'propose_override'
  | 'apply_override'
  | 'view_audit'
  | 'view_usage'
  | 'manage_users'
  | 'manage_integrations'
  | 'admin_access';

const ROLE_PERMISSIONS: Record<string, readonly Action[]> = {
  super_admin: [
    'view', 'create_task', 'edit_task', 'assign_task',
    'edit_persona', 'propose_override', 'apply_override',
    'view_audit', 'view_usage', 'manage_users', 'manage_integrations', 'admin_access',
  ],
  admin: [
    'view', 'create_task', 'edit_task', 'assign_task',
    'edit_persona', 'propose_override', 'apply_override',
    'view_audit', 'view_usage', 'manage_integrations', 'admin_access',
  ],
  team_lead: [
    'view', 'create_task', 'edit_task', 'assign_task',
    'propose_override', 'view_audit',
  ],
  contributor: [
    'view', 'create_task', 'edit_task',
  ],
  viewer: [
    'view',
  ],
} as const;

export function can(role: UserRoleValue | undefined, action: Action): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(action);
}

export function canAny(role: UserRoleValue | undefined, actions: Action[]): boolean {
  return actions.some((a) => can(role, a));
}
