'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const supabase = createBrowserSupabaseClient();

      // Parse tokens from the URL hash fragment (#access_token=...&refresh_token=...)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!sessionError) {
          // Clear the hash from the URL before navigating
          window.history.replaceState(null, '', window.location.pathname);
          router.replace('/onboarding');
          return;
        }
      }

      // Fallback: check if session was already established (e.g. PKCE flow)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/onboarding');
        return;
      }

      setError('Unable to verify your invite link. It may have expired.');
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="outlined" onClick={() => router.push('/login')}>
            Back to Sign In
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Verifying your invite...
      </Typography>
    </Box>
  );
}
