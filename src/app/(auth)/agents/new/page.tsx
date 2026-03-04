'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { PageContainer, Header } from '@/components/layout';
import { createAgent, uploadAgentAvatar, updateAgent } from '@/features/agents/service';
import { useAuth } from '@/hooks/useAuth';
import { AgentStatus } from '@/lib/constants';
import type { AgentStatusValue } from '@/lib/constants';
import { PROVIDER_MODELS, PROVIDER_OPTIONS } from '@/lib/provider-models';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const STATUS_OPTIONS: { value: AgentStatusValue; label: string }[] = [
  { value: AgentStatus.OFFLINE, label: 'Offline' },
  { value: AgentStatus.ACTIVE, label: 'Active' },
  { value: AgentStatus.DISABLED, label: 'Disabled' },
  { value: AgentStatus.PLANNED, label: 'Planned' },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [defaultModel, setDefaultModel] = useState(PROVIDER_MODELS.anthropic.models[0].value);
  const [basePersonaVersion, setBasePersonaVersion] = useState('v1.0');
  const [status, setStatus] = useState<AgentStatusValue>(AgentStatus.OFFLINE);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Please upload a PNG, JPEG, or WebP image.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ type: 'error', message: 'Image must be under 2 MB.' });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !role.trim()) {
      setFeedback({ type: 'error', message: 'Name and Role are required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const agent = await createAgent(
        {
          name: name.trim(),
          role: role.trim(),
          description: description.trim(),
          provider,
          defaultModel: defaultModel.trim(),
          basePersonaVersion: basePersonaVersion.trim() || 'v1.0',
          status,
        },
        user ? { actorId: user.id, reason: 'Agent created via Control Center' } : undefined,
      );

      if (avatarFile) {
        const avatarUrl = await uploadAgentAvatar(agent.id, avatarFile);
        await updateAgent(agent.id, { avatarUrl });
      }

      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <Header
        title="New Agent"
        subtitle="Create a new AI agent persona"
        breadcrumbs={[
          { label: 'Agents', href: '/agents' },
          { label: 'New Agent' },
        ]}
      />

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
                  sx={{ width: 72, height: 72, bgcolor: 'action.selected' }}
                >
                  <SmartToyIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 24, color: 'common.white' }} />
                </Box>
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Click to upload an avatar (optional)
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Axel"
                fullWidth
              />
              <TextField
                label="Role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Engineering"
                fullWidth
              />
              <TextField
                select
                label="Provider"
                value={provider}
                onChange={(e) => {
                  const next = e.target.value;
                  setProvider(next);
                  setDefaultModel(PROVIDER_MODELS[next]?.models[0]?.value ?? '');
                }}
                fullWidth
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Default Model"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                fullWidth
              >
                {(PROVIDER_MODELS[provider]?.models ?? []).map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Persona Version"
                value={basePersonaVersion}
                onChange={(e) => setBasePersonaVersion(e.target.value)}
                placeholder="v1.0"
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AgentStatusValue)}
                fullWidth
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/agents')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} /> : undefined}
              >
                {saving ? 'Creating...' : 'Create Agent'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
