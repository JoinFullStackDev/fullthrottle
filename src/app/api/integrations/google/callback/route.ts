import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServiceRoleClient } from '@/lib/supabase/server';

function getRedirectUri(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('host');
  const base = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL!;
  return `${base}/api/integrations/google/callback`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/integrations?google_error=${error}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/integrations?google_error=missing_params', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/integrations?google_error=not_configured', req.url));
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(req));

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/integrations?google_error=no_refresh_token', req.url),
      );
    }

    const integrationId = state;
    const supabase = createServiceRoleClient();

    const { data: existing } = await supabase
      .from('integration_credentials')
      .select('id')
      .eq('integration_id', integrationId)
      .single();

    const credentialPayload = {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token ?? null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope ?? null,
    };

    if (existing) {
      await supabase
        .from('integration_credentials')
        .update({ credentials: credentialPayload as never })
        .eq('integration_id', integrationId);
    } else {
      await supabase
        .from('integration_credentials')
        .insert({
          integration_id: integrationId,
          credentials: credentialPayload,
        } as never);
    }

    await supabase
      .from('integrations')
      .update({ status: 'connected' } as never)
      .eq('id', integrationId);

    return NextResponse.redirect(new URL('/admin?google_connected=true', req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed';
    return NextResponse.redirect(
      new URL(`/admin?google_error=${encodeURIComponent(message)}`, req.url),
    );
  }
}
