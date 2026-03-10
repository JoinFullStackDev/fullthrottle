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

interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  description: string | null;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { instanceUrl, accessToken, groupId } = body as {
    instanceUrl?: string;
    accessToken?: string;
    groupId?: number | string;
  };

  if (!instanceUrl || !accessToken || !groupId) {
    return NextResponse.json(
      { error: 'instanceUrl, accessToken, and groupId are required' },
      { status: 400 },
    );
  }

  const baseUrl = instanceUrl.replace(/\/+$/, '');
  const token = accessToken.trim();

  try {
    const res = await gitlabFetch(
      `${baseUrl}/api/v4/groups/${encodeURIComponent(groupId)}/projects?per_page=100&include_subgroups=true&order_by=name&sort=asc`,
      token,
    );

    if (res.status !== 200) {
      let detail = '';
      try {
        const parsed = JSON.parse(res.body) as Record<string, unknown>;
        detail = String(parsed.message ?? parsed.error ?? '');
      } catch {
        detail = res.body.slice(0, 200);
      }
      return NextResponse.json(
        { error: `GitLab returned ${res.status}. ${detail}`.trim() },
        { status: 422 },
      );
    }

    const glProjects = parseJsonBody<GitLabProject[]>(res.body);

    return NextResponse.json({
      projects: glProjects.map((p) => ({
        id: p.id,
        name: p.name,
        pathWithNamespace: p.path_with_namespace,
        webUrl: p.web_url,
        description: p.description ?? '',
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
