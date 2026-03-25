// app/api/clutch/users/role/route.ts
// PATCH /api/clutch/users/role
//
// Allows a caller with role >= team_lead to update another user's role.
// ARC architecture plan: 2026-03-24
// ARC corrections: C1 callerRole validation, C2 email lookup via profiles table, C3 IDENTIFIER_CONFLICT audit log.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createAuditEntry } from '@/features/audit/service-server';
import { authenticateClutchBearer } from '../../_lib/auth';
import {
  VALID_ROLES,
  ROLE_HIERARCHY,
  MIN_ROLE_LEVEL_TO_ASSIGN,
  isValidRole,
  type Role,
} from '@/lib/roles';

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

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
  const body = await req.json().catch(() => null);
  const { email, userId, role } = (body ?? {}) as {
    email?: string;
    userId?: string;
    role?: string;
  };

  if (!email && !userId) {
    return errorResponse(400, 'MISSING_IDENTIFIER', 'Either email or userId must be provided');
  }

  if (!role) {
    return errorResponse(
      400,
      'INVALID_ROLE',
      `Invalid role value. Valid roles: ${VALID_ROLES.join(', ')}`,
    );
  }

  if (!VALID_ROLES.includes(role as Role)) {
    return errorResponse(
      400,
      'INVALID_ROLE',
      `Invalid role value. Valid roles: ${VALID_ROLES.join(', ')}`,
    );
  }

  const targetRole = role as Role;

  // ── 3. Minimum permission check ───────────────────────────────────────────
  if (ROLE_HIERARCHY[callerRole] < MIN_ROLE_LEVEL_TO_ASSIGN) {
    return errorResponse(403, 'FORBIDDEN', 'Insufficient permissions to update user roles');
  }

  // ── 4. Resolve target user(s) ─────────────────────────────────────────────
  type TargetUser = { id: string; email?: string; user_metadata?: Record<string, unknown>; updated_at?: string };
  let targetUserById: TargetUser | null = null;
  let targetUserByEmail: TargetUser | null = null;

  if (userId) {
    const { data, error } = await svc.auth.admin.getUserById(userId);
    if (error) console.error('[PATCH /users/role] getUserById error', error);
    targetUserById = data?.user
      ? { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata as Record<string, unknown>, updated_at: data.user.updated_at }
      : null;
  }

  // ── C2: Email → UUID via profiles table (avoids listUsers page limit) ─────
  if (email) {
    const { data: profile, error: profileError } = await svc
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('[PATCH /users/role] profiles email lookup error', profileError);
    } else {
      const { data, error } = await svc.auth.admin.getUserById(profile.id);
      if (error) console.error('[PATCH /users/role] getUserById (via email lookup) error', error);
      targetUserByEmail = data?.user
        ? { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata as Record<string, unknown>, updated_at: data.user.updated_at }
        : null;
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
      actionType: 'user_role_update_failed',
      entityType: 'profile',
      entityId: callerId,
      reason: 'IDENTIFIER_CONFLICT: email and userId resolve to different users',
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

  // ── 9. Upsert profiles table (soft-fail) ──────────────────────────────────
  const { error: upsertError } = await svc
    .from('profiles')
    .update({ role: targetRole } as never)
    .eq('id', targetUser.id);

  if (upsertError) {
    console.error(
      '[PATCH /users/role] profiles update failed — auth updated, profiles table may be out of sync',
      upsertError,
    );
  }

  // ── 10. Audit log (success) ───────────────────────────────────────────────
  void createAuditEntry(svc, {
    actorId: callerId,
    actionType: 'user_role_updated',
    entityType: 'profile',
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
