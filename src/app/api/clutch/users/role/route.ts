// app/api/clutch/users/role/route.ts
// PATCH /api/clutch/users/role
//
// Allows a caller with role >= team_lead to update another user's role.
// ARC architecture plan: 2026-03-24
// ARC corrections applied: C1 callerRole validation, C2 email lookup via users table, C3 IDENTIFIER_CONFLICT audit log.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { authenticateClutchBearer } from '../../_lib/auth';
import { createAuditEntry } from '@/features/audit/service-server';
import { VALID_ROLES, ROLE_HIERARCHY, MIN_ROLE_LEVEL_TO_ASSIGN, isValidRole, type Role } from '@/lib/roles';

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

const updateRoleSchema = z
  .object({
    email: z.string().email('Invalid email format').optional(),
    userId: z.string().uuid('Invalid UUID format').optional(),
    role: z.enum(VALID_ROLES, {
      errorMap: () => ({
        message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`,
      }),
    }),
  })
  .refine((d) => d.email || d.userId, {
    message: 'Either email or userId must be provided',
    path: ['email'],
  });

export async function PATCH(req: NextRequest) {
  const svc = createServiceRoleClient();

  // ── 1. Authenticate caller ────────────────────────────────────────────────
  const callerUser = await authenticateClutchBearer(req);
  if (!callerUser) {
    return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
  }

  const callerId = callerUser.id;
  const callerRoleRaw = callerUser.user_metadata?.role;

  // ── C1: Validate callerRole against VALID_ROLES ───────────────────────────
  // ROLE_HIERARCHY[unknown_role] returns undefined; undefined < 3 === false in JS,
  // which would silently bypass all permission checks without this guard.
  if (!isValidRole(callerRoleRaw)) {
    return errorResponse(403, 'FORBIDDEN', 'Insufficient permissions to update user roles');
  }
  const callerRole: Role = callerRoleRaw;

  // ── 2. Parse + validate request body ─────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'MISSING_IDENTIFIER', 'Request body must be valid JSON');
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const isRoleError =
      firstIssue.path.includes('role') ||
      firstIssue.message.toLowerCase().includes('role');
    if (isRoleError) {
      return errorResponse(
        400,
        'INVALID_ROLE',
        `Invalid role value. Valid roles: ${VALID_ROLES.join(', ')}`,
      );
    }
    return errorResponse(400, 'MISSING_IDENTIFIER', firstIssue.message);
  }

  const { email, userId, role: targetRole } = parsed.data;

  // ── 3. Minimum permission check ───────────────────────────────────────────
  if (ROLE_HIERARCHY[callerRole] < MIN_ROLE_LEVEL_TO_ASSIGN) {
    return errorResponse(403, 'FORBIDDEN', 'Insufficient permissions to update user roles');
  }

  // ── 4. Resolve target user ────────────────────────────────────────────────
  let targetUserById: Awaited<ReturnType<typeof svc.auth.admin.getUserById>>['data']['user'] | null = null;
  let targetUserByEmail: typeof targetUserById = null;

  if (userId) {
    const { data, error } = await svc.auth.admin.getUserById(userId);
    if (error) console.error('[PATCH /users/role] getUserById error', error);
    targetUserById = data?.user ?? null;
  }

  // ── C2: Email → UUID via users table (replaces listUsers perPage:1000) ────
  if (email) {
    const { data: appUser, error: appLookupError } = await svc
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (appLookupError || !appUser) {
      console.error('[PATCH /users/role] users table email lookup error', appLookupError);
    } else {
      const { data, error } = await svc.auth.admin.getUserById(appUser.id);
      if (error) console.error('[PATCH /users/role] getUserById (via email lookup) error', error);
      targetUserByEmail = data?.user ?? null;
    }
  }

  // ── C3: Audit log on IDENTIFIER_CONFLICT (was missing) ───────────────────
  if (
    userId &&
    email &&
    targetUserById &&
    targetUserByEmail &&
    targetUserById.id !== targetUserByEmail.id
  ) {
    void createAuditEntry(svc, {
      actorId: callerId,
      actionType: 'USER_ROLE_UPDATE_FAILED',
      entityType: 'user',
      entityId: callerId,
      reason: 'IDENTIFIER_CONFLICT',
    });
    return errorResponse(
      400,
      'IDENTIFIER_CONFLICT',
      'The provided email and userId resolve to different users',
    );
  }

  const targetUser = targetUserById ?? targetUserByEmail;

  if (!targetUser) {
    return errorResponse(404, 'USER_NOT_FOUND', 'No user found with the provided identifier');
  }

  // ── 5. Self-update guard ──────────────────────────────────────────────────
  if (targetUser.id === callerId) {
    return errorResponse(422, 'CANNOT_UPDATE_SELF', 'You cannot update your own role');
  }

  // ── 6. Privilege escalation guard ────────────────────────────────────────
  if (ROLE_HIERARCHY[targetRole] > ROLE_HIERARCHY[callerRole]) {
    return errorResponse(403, 'PRIVILEGE_ESCALATION', 'Cannot assign a role higher than your own');
  }

  // ── 7. Idempotency check ──────────────────────────────────────────────────
  const currentRole = targetUser.user_metadata?.role as Role | undefined;
  const isUnchanged = currentRole === targetRole;

  // ── 8. Update auth metadata (source of truth) ────────────────────────────
  const { data: updatedData, error: updateError } =
    await svc.auth.admin.updateUserById(targetUser.id, {
      user_metadata: {
        ...(targetUser.user_metadata ?? {}),
        role: targetRole,
      },
    });

  if (updateError || !updatedData.user) {
    console.error('[PATCH /users/role] updateUserById failed', updateError);
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  // ── 9. Upsert app-layer users table (soft-fail) ───────────────────────────
  const { error: upsertError } = await svc
    .from('users')
    .upsert(
      {
        id: targetUser.id,
        email: updatedData.user.email,
        role: targetRole,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (upsertError) {
    console.error(
      '[PATCH /users/role] users table upsert failed — auth updated, app table may be out of sync',
      upsertError,
    );
  }

  // ── 10. Audit log (success) ───────────────────────────────────────────────
  void createAuditEntry(svc, {
    actorId: callerId,
    actionType: 'USER_ROLE_UPDATED',
    entityType: 'user',
    entityId: targetUser.id,
    beforeState: { role: currentRole ?? null },
    afterState: { role: targetRole },
    reason: `Role updated by ${callerRole} via Clutch API`,
  });

  // ── 11. Response ──────────────────────────────────────────────────────────
  const responseBody: {
    success: boolean;
    warnings?: string[];
    user: { id: string; email: string | undefined; role: Role; updatedAt: string | undefined };
  } = {
    success: true,
    user: {
      id: updatedData.user.id,
      email: updatedData.user.email,
      role: targetRole,
      updatedAt: updatedData.user.updated_at,
    },
  };

  if (isUnchanged) responseBody.warnings = ['ROLE_UNCHANGED'];

  return NextResponse.json(responseBody, { status: 200 });
}
