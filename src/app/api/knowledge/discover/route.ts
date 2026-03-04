import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import { listDriveFiles, listDriveRoots, isSupported } from '@/lib/knowledge/google-drive';

type ProfileRow = Tables<'profiles'>;

async function getAdminAndRefreshToken(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes((profile as ProfileRow).role)) {
    return { error: 'Forbidden', status: 403 };
  }

  const body = await req.json();
  const { integrationId, folderId, action } = body;

  if (!integrationId) {
    return { error: 'integrationId is required', status: 400 };
  }

  const svc = createServiceRoleClient();
  const { data: creds } = await svc
    .from('integration_credentials')
    .select('credentials')
    .eq('integration_id', integrationId)
    .single();

  if (!creds) {
    return { error: 'No credentials found. Please connect Google Drive first.', status: 404 };
  }

  const credentials = creds.credentials as Record<string, unknown>;
  const refreshToken = credentials.refreshToken as string | undefined;

  if (!refreshToken) {
    return { error: 'No OAuth refresh token found. Please reconnect Google Drive.', status: 400 };
  }

  return { refreshToken, folderId, action };
}

export async function POST(req: NextRequest) {
  const result = await getAdminAndRefreshToken(req);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { refreshToken, folderId, action } = result;

  try {
    if (action === 'listRoots') {
      const roots = await listDriveRoots({ refreshToken });
      return NextResponse.json({ roots });
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required for browsing' },
        { status: 400 },
      );
    }

    const allItems = await listDriveFiles({ refreshToken }, folderId);

    const folders = allItems
      .filter((f) => f.isFolder)
      .map((f) => ({ id: f.id, name: f.name }));

    const files = allItems
      .filter((f) => !f.isFolder)
      .map((f) => ({
        ...f,
        supported: isSupported(f.mimeType),
      }));

    return NextResponse.json({ folders, files });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list Drive contents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
