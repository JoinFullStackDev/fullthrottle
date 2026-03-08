# FullThrottle AI — Deployment Guide

---

## Prerequisites

- GitHub repo: `JoinFullStackDev/fullthrottle`
- Supabase project with all migrations applied (00001-00016)
- Google Cloud project with OAuth 2.0 credentials
- Anthropic API key
- Google AI (Gemini) API key

---

## 1. Vercel Project Setup

1. Go to [vercel.com](https://vercel.com) and import the `JoinFullStackDev/fullthrottle` repository
2. **Framework:** Next.js (auto-detected)
3. **Root Directory:** `.` (the repo root is the app root)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `.next` (default)

---

## 2. Environment Variables

Set all of these in the Vercel project dashboard under **Settings > Environment Variables.** Values come from `.env` (local) or your service dashboards.

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (bypasses RLS) |
| `RUNTIME_MODE` | Server only | `direct-llm` for live agents, `stub` for placeholder |
| `ANTHROPIC_API_KEY` | Server only | Anthropic API key for Claude agents |
| `GOOGLE_AI_API_KEY` | Server only | Google AI API key for Gemini agents |
| `GOOGLE_CLIENT_ID` | Server only | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Server only | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client | Google OAuth client ID (for browser-side OAuth) |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Full staging URL, e.g. `https://fullthrottle-staging.vercel.app` |

After the first deploy, update `NEXT_PUBLIC_SITE_URL` to match the actual Vercel domain and redeploy.

---

## 3. Supabase Configuration

### Migrations

Migrations 00001-00016 must be applied. If 00016 (Clutch intake) hasn't been applied yet, run it in the Supabase SQL Editor:

1. Go to your Supabase project > **SQL Editor**
2. Paste the contents of `supabase/migrations/00016_clutch_intake.sql`
3. Execute

### Authentication Redirect URLs

In Supabase dashboard > **Authentication > URL Configuration:**

- **Site URL:** `https://{your-staging-domain}.vercel.app`
- **Redirect URLs:** Add:
  - `https://{your-staging-domain}.vercel.app/auth/callback`
  - `https://{your-staging-domain}.vercel.app/**`

For local development, also keep:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

---

## 4. Google Cloud Console

In Google Cloud > **APIs & Services > Credentials > OAuth 2.0 Client:**

**Authorized JavaScript Origins:**
- `https://{your-staging-domain}.vercel.app`
- `http://localhost:3000` (for local dev)

**Authorized Redirect URIs:**
- `https://{your-staging-domain}.vercel.app/api/integrations/google/callback`
- `http://localhost:3000/api/integrations/google/callback` (for local dev)

---

## 5. Post-Deploy Verification

After the first successful deploy:

1. **Visit the staging URL** — verify the login page loads
2. **Log in** with your admin credentials
3. **Check the dashboard** — verify it loads without errors
4. **Check agents** — verify Axel, Riff, Torque, and Clutch appear
5. **Check conversations** — verify streaming chat works (requires LLM API keys)
6. **Check integrations** — verify Google Drive OAuth connect works (requires Google OAuth config)

---

## 6. Clutch System User (for VPS Integration)

To create the Clutch system user for VPS integration:

1. Log in as an admin
2. Call `POST /api/admin/seed` (only works in non-production environments)
3. The response includes the Clutch system user ID and password
4. Save the password — it's needed as `CLUTCH_PASSWORD` on the VPS

Alternatively, set `CLUTCH_SYSTEM_PASSWORD` in the environment before running seed to control the password.

---

## 7. Ongoing Deployments

Vercel auto-deploys on push to the connected branch. For environment variable changes:

1. Update the variable in Vercel dashboard
2. Trigger a redeploy (Vercel > Deployments > Redeploy)

Variables prefixed with `NEXT_PUBLIC_` are baked into the client bundle at build time, so changing them requires a redeploy to take effect.

---

## Seed Route

The `/api/admin/seed` endpoint populates development data (tasks, persona overrides, conversations, audit logs, Clutch system user). It is:

- **Disabled in production** (`NODE_ENV === 'production'` returns 403)
- **Requires admin auth** (super_admin or admin role)
- **Safe to re-run** (cleans up previous seed data first)

---

## Architecture Notes

- **Persona files** (`docs/_AGENTS/*/persona.md`) are read from the filesystem at runtime by the persona assembler. They are included in serverless function bundles via `outputFileTracingIncludes` in `next.config.ts`.
- **Session refresh** happens via `src/proxy.ts` (Next.js 16 middleware pattern) on every request.
- **All admin/privileged operations** run through Next.js API routes using the Supabase service-role client — never from the browser.
