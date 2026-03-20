/**
 * POST /api/clutch/updates
 *
 * Assembles a status update for an admin, including:
 *   - Recent Granola meeting notes/summaries
 *   - (Future: active task summary, recent agent activity)
 *
 * Called by Clutch when an admin asks for a status update via Slack or iMessage.
 * Only admins (by role or ADMIN_IDENTITIES match) may request updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateClutchBearer } from '../_lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { fetchRecentNotes, formatNotesForUpdate } from '@/lib/integrations/granola';
import { isAdminSlackUser, ADMIN_IDENTITIES } from '@/lib/access/admin-guard';

export async function POST(req: NextRequest) {
  const user = await authenticateClutchBearer(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify requester is an admin
  const svc = createServiceRoleClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'super_admin' ||
    profile?.role === 'admin' ||
    isAdminSlackUser(profile?.name ?? '');

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Status updates are only available to admins.' },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));

  // Optional: how many days back to look for meeting notes (default 7)
  const daysSince = Math.min(parseInt(body.daysSince ?? '7', 10) || 7, 30);
  const since = new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000).toISOString();

  // Fetch Granola notes and active tasks in parallel
  const [granolaResult, tasksResult] = await Promise.all([
    fetchRecentNotes(since, 10),
    svc
      .from('tasks')
      .select('title, status, priority, owner_id, project_tag')
      .neq('status', 'done')
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  // Format meeting notes
  const meetingSection = formatNotesForUpdate(granolaResult);

  // Format active tasks summary
  const tasks = tasksResult.data ?? [];
  let taskSection = '';
  if (tasks.length > 0) {
    const byStatus: Record<string, number> = {};
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    }
    const statusSummary = Object.entries(byStatus)
      .map(([s, n]) => `${n} ${s.replace('_', ' ')}`)
      .join(', ');
    taskSection = `📋 *Active tasks:* ${tasks.length} open (${statusSummary})`;

    const critical = tasks.filter((t) => t.priority === 'critical' || t.priority === 'high');
    if (critical.length > 0) {
      taskSection += `\n*High priority:*\n` +
        critical.slice(0, 5).map((t) => `• ${t.title}${t.project_tag ? ` (${t.project_tag})` : ''}`).join('\n');
    }
  }

  const sections = [meetingSection, taskSection].filter(Boolean);
  const update = sections.join('\n\n');

  return NextResponse.json({
    update,
    generatedAt: new Date().toISOString(),
    requestedBy: profile?.name ?? user.id,
  });
}
