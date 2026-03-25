/**
 * Role definitions and hierarchy for FullThrottle.
 *
 * Single source of truth for role validation and permission checks.
 * Used by: /api/clutch/users/invite, /api/clutch/users/role
 */

export const VALID_ROLES = [
  'super_admin',
  'admin',
  'team_lead',
  'contributor',
  'viewer',
] as const;

export type Role = (typeof VALID_ROLES)[number];

/**
 * Numeric hierarchy — higher = more privileged.
 * Used to enforce: callers cannot assign roles above their own level.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 5,
  admin: 4,
  team_lead: 3,
  contributor: 2,
  viewer: 1,
};

/** Minimum role level required to call the role-update endpoint. */
export const MIN_ROLE_LEVEL_TO_ASSIGN = 3; // team_lead and above

/** Type guard: checks if a string is a valid Role. */
export function isValidRole(role: unknown): role is Role {
  return typeof role === 'string' && (VALID_ROLES as readonly string[]).includes(role);
}
