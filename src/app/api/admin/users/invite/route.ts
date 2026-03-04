import { NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '@/lib/supabase/server';
import { createAuditEntry } from '@/features/audit/service-server';
import type { Tables } from '@/lib/supabase/database.types';

type ProfileRow = Tables<'profiles'>;

const VALID_ROLES = [
  'super_admin',
  'admin',
  'team_lead',
  'contributor',
  'viewer',
] as const;

async function getCallerProfile() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  return data as Pick<ProfileRow, 'id' | 'role'> | null;
}

export async function POST(request: Request) {
  const caller = await getCallerProfile();
  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body as { email?: string; role?: string };

  if (!email || !role) {
    return NextResponse.json(
      { error: 'email and role are required' },
      { status: 400 },
    );
  }

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
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
      actorId: caller.id,
      actionType: 'user_invited',
      entityType: 'profile',
      entityId: userId,
      afterState: { email, role },
      reason: 'Admin invited user via email',
    });
  }

  return NextResponse.json({ success: true, userId });
}
