'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CameraAltIcon from '@mui/icons-material/CameraAltOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { uploadAvatar, updateProfile } from '@/lib/services/profiles';
import { useAuth } from '@/hooks/useAuth';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && user?.onboardedAt) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 2 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setError(pwError.message);
      setSaving(false);
      return;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setError('Session expired. Please use the invite link again.');
      setSaving(false);
      return;
    }

    let avatarUrl: string | null = null;
    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatar(authUser.id, avatarFile);
      } catch (err) {
        setError((err as Error).message);
        setSaving(false);
        return;
      }
    }

    try {
      await updateProfile(authUser.id, {
        name: name.trim(),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        onboarded_at: new Date().toISOString(),
      });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  if (isLoading || (user && user.onboardedAt)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper sx={{ p: 5, width: '100%', maxWidth: 460 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Welcome to FullThrottle AI
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Complete your profile to get started.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                hidden
                onChange={handleAvatarSelect}
              />
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{ p: 0, position: 'relative' }}
                aria-label="Upload avatar"
              >
                <Avatar
                  src={avatarPreview ?? undefined}
                  sx={{ width: 80, height: 80, bgcolor: 'action.selected' }}
                >
                  <PersonIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 24, color: 'common.white' }} />
                </Box>
              </IconButton>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
              >
                Add photo
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            autoFocus
            disabled={saving}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            disabled={saving}
            helperText="Minimum 6 characters"
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            disabled={saving}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={saving}
            sx={{ mt: 1 }}
          >
            {saving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Complete Setup'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
