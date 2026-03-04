import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';

type ProfileRow = Tables<'profiles'>;

async function getCallerRole(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (data as ProfileRow | null)?.role ?? null;
}

export async function GET() {
  const role = await getCallerRole();
  if (!role || !['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const svc = createServiceRoleClient();
  const { data, error } = await svc.from('profiles').select('*').order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const role = await getCallerRole();
  if (!role || !['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, newRole } = body as { userId: string; newRole: string };

  if (!userId || !newRole) {
    return NextResponse.json({ error: 'userId and newRole are required' }, { status: 400 });
  }

  const validRoles = ['super_admin', 'admin', 'team_lead', 'contributor', 'viewer'];
  if (!validRoles.includes(newRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  const { data, error } = await svc
    .from('profiles')
    .update({ role: newRole } as never)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const role = await getCallerRole();
  if (!role || !['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const svc = createServiceRoleClient();

  // Deleting the auth user cascades to the profiles row (ON DELETE CASCADE)
  const { error } = await svc.auth.admin.deleteUser(userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
