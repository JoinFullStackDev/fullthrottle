/**
 * Admin Guard — merge approval and sensitive operation access control.
 *
 * Defines who is authorized to approve final merges, deployments, and other
 * destructive/irreversible operations initiated via Slack or iMessage.
 *
 * Policy:
 *   - Any team member can request feature branches, code changes, PRs, analysis
 *   - Only ADMIN_IDENTITIES may give final merge/deploy approval
 *   - Clutch must check this before acting on any merge/deploy request
 *   - If a non-admin requests a merge, Clutch escalates to an admin for approval
 *
 * Identity matching:
 *   - Slack: matched by display name (case-insensitive) or Slack user ID once known
 *   - iMessage: matched by phone number or Apple ID email
 *
 * To add/remove admins: edit ADMIN_IDENTITIES below and redeploy.
 */

export interface AdminIdentity {
  name: string;
  /** Slack display names to match (lowercase) */
  slackNames: string[];
  /** iMessage handles: phone numbers (+1...) or Apple ID emails */
  iMessageHandles: string[];
}

export const ADMIN_IDENTITIES: AdminIdentity[] = [
  {
    name: 'Spencer Green',
    slackNames: ['spencer', 'spencer green', 'spencergreen', 'spenny'],
    iMessageHandles: [], // add Spencer's personal phone/Apple ID here
  },
  {
    name: 'Jake Browning',
    slackNames: ['jake', 'jake browning', 'jakebrowning', 'browning'],
    iMessageHandles: [], // add Jake's phone/Apple ID here
  },
  {
    name: "Joe O'Banion",
    slackNames: ['joe', "joe o'banion", 'joeobanion', 'obanion'],
    iMessageHandles: [], // add Joe's phone/Apple ID here
  },
  {
    name: 'Omar Bravo',
    slackNames: ['omar', 'omar bravo', 'omarbravo'],
    iMessageHandles: [], // add Omar's phone/Apple ID here
  },
];

/**
 * Operations that require admin approval before Clutch can act on them.
 * Matched against the request text (case-insensitive).
 */
export const MERGE_APPROVAL_KEYWORDS = [
  'merge', 'squash and merge', 'approve pr', 'approve pull request',
  'merge to main', 'merge to master', 'merge to staging', 'merge to prod',
  'deploy to prod', 'deploy to production', 'deploy to staging',
  'cut a release', 'push to production', 'push to prod',
  'delete branch', 'force push',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isAdminSlackUser(slackDisplayName: string): boolean {
  const lower = slackDisplayName.toLowerCase().trim();
  return ADMIN_IDENTITIES.some((a) => a.slackNames.includes(lower));
}

export function isAdminIMessageHandle(handle: string): boolean {
  const normalized = handle.trim().toLowerCase();
  return ADMIN_IDENTITIES.some((a) =>
    a.iMessageHandles.some((h) => h.toLowerCase() === normalized),
  );
}

export function requiresMergeApproval(requestText: string): boolean {
  const lower = requestText.toLowerCase();
  return MERGE_APPROVAL_KEYWORDS.some((kw) => lower.includes(kw));
}

export function getAdminNameForSlack(slackDisplayName: string): string | null {
  const lower = slackDisplayName.toLowerCase().trim();
  return ADMIN_IDENTITIES.find((a) => a.slackNames.includes(lower))?.name ?? null;
}

export function formatAdminList(): string {
  return ADMIN_IDENTITIES.map((a) => a.name).join(', ');
}
