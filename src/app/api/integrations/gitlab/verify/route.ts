import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import { gitlabFetch, parseJsonBody } from '@/lib/gitlab-fetch';

type ProfileRow = Tables<'profiles'>;

async function getAdminUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes((profile as ProfileRow).role)) return null;
  return user;
}

interface GitLabUser {
  id: number;
  username: string;
  name: string;
}

interface GitLabGroup {
  id: number;
  name: string;
  full_path: string;
  web_url: string;
}

function extractDetail(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return String(parsed.message ?? parsed.error ?? '');
  } catch {
    return raw.slice(0, 200);
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { instanceUrl, accessToken } = body as { instanceUrl?: string; accessToken?: string };

  if (!instanceUrl || !accessToken) {
    return NextResponse.json({ error: 'instanceUrl and accessToken are required' }, { status: 400 });
  }

  const baseUrl = instanceUrl.replace(/\/+$/, '');
  const token = accessToken.trim();

  try {
    const userRes = await gitlabFetch(`${baseUrl}/api/v4/user`, token);

    if (userRes.status !== 200) {
      const detail = extractDetail(userRes.body);
      if (userRes.status === 401) {
        return NextResponse.json(
          { error: `Authentication failed (401). Ensure you are using a Personal Access Token with "api" scope. ${detail}`.trim() },
          { status: 422 },
        );
      }
      if (userRes.status === 403) {
        return NextResponse.json(
          { error: `Forbidden (403). The token may lack required scopes. ${detail}`.trim() },
          { status: 422 },
        );
      }
      return NextResponse.json(
        { error: `GitLab returned ${userRes.status}. ${detail}`.trim() },
        { status: 422 },
      );
    }

    const glUser = parseJsonBody<GitLabUser>(userRes.body);

    const groupsRes = await gitlabFetch(
      `${baseUrl}/api/v4/groups?min_access_level=10&per_page=100`,
      token,
    );

    if (groupsRes.status !== 200) {
      const detail = extractDetail(groupsRes.body);
      return NextResponse.json(
        { error: `Failed to fetch groups (${groupsRes.status}). ${detail}`.trim() },
        { status: 422 },
      );
    }

    const glGroups = parseJsonBody<GitLabGroup[]>(groupsRes.body);

    return NextResponse.json({
      user: { id: glUser.id, username: glUser.username, name: glUser.name },
      groups: glGroups.map((g) => ({
        id: g.id,
        name: g.name,
        fullPath: g.full_path,
        webUrl: g.web_url,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
