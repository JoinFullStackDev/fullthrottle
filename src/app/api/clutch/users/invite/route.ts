import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createAuditEntry } from '@/features/audit/service-server';
import { authenticateClutchBearer } from '../../_lib/auth';

const VALID_ROLES = [
  'super_admin',
  'admin',
  'team_lead',
  'contributor',
  'viewer',
] as const;

export async function POST(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { email, role } = (body ?? {}) as { email?: string; role?: string };

  if (!email || !role) {
    return NextResponse.json(
      { error: 'email and role are required' },
      { status: 400 },
    );
  }

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SITE_URL is not configured' },
      { status: 500 },
    );
  }

  const svc = createServiceRoleClient();

  const { data: inviteData, error: inviteError } =
    await svc.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      data: { role },
    });

  if (inviteError) {
    return NextResponse.json(
      { error: inviteError.message },
      { status: 400 },
    );
  }

  const userId = inviteData.user?.id;

  if (userId) {
    await svc
      .from('profiles')
      .update({ invited_at: new Date().toISOString() } as never)
      .eq('id', userId);

    await createAuditEntry(svc, {
      actorId: user.id,
      actionType: 'user_invited',
      entityType: 'profile',
      entityId: userId,
      afterState: { email, role },
      reason: 'Clutch agent invited user via API',
    });
  }

  return NextResponse.json({ success: true, userId });
}
