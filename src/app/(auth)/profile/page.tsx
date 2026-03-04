'use client';

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import CameraAltIcon from '@mui/icons-material/CameraAltOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile, uploadAvatar } from '@/lib/services/profiles';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function ProfilePage() {
  const { user, isLoading, refresh } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Please upload a PNG, JPEG, or WebP image.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ type: 'error', message: 'Image must be under 2 MB.' });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: url });
      setAvatarUrl(url);
      refresh();
      setFeedback({ type: 'success', message: 'Avatar updated.' });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateProfile(user.id, { name: name.trim() });
      refresh();
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) return null;

  const hasChanges = name.trim() !== user.name;

  return (
    <PageContainer maxWidth={800}>
      <Header
        title="Profile"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' },
        ]}
      />

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <SectionContainer title="Personal Information">
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                hidden
                onChange={handleAvatarUpload}
              />
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{ p: 0, position: 'relative' }}
                aria-label="Upload avatar"
              >
                <Avatar
                  src={avatarUrl ?? undefined}
                  sx={{ width: 56, height: 56, bgcolor: 'action.selected' }}
                >
                  <PersonIcon />
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
                    opacity: uploading ? 1 : 0,
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  {uploading ? (
                    <CircularProgress size={20} sx={{ color: 'common.white' }} />
                  ) : (
                    <CameraAltIcon sx={{ fontSize: 20, color: 'common.white' }} />
                  )}
                </Box>
              </IconButton>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {user.role.replace(/_/g, ' ')}
                </Typography>
              </Box>
            </Box>

            <Divider />

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              label="Email"
              value={user.email}
              fullWidth
              size="small"
              disabled
              helperText="Email cannot be changed"
            />

            <TextField
              label="Role"
              value={user.role.replace(/_/g, ' ')}
              fullWidth
              size="small"
              disabled
              helperText="Role is managed by administrators"
              slotProps={{ input: { sx: { textTransform: 'capitalize' } } }}
            />

            <Typography variant="caption" color="text.secondary">
              Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </SectionContainer>
    </PageContainer>
  );
}
