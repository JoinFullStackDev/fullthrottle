'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import RemoveIcon from '@mui/icons-material/RemoveCircleOutline';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import LinkIcon from '@mui/icons-material/LinkOutlined';
import type { IntegrationTypeValue } from '@/lib/constants';
import { INTEGRATION_LABELS } from '@/lib/constants';
import type { Integration } from '@/lib/types';

interface ChannelMapping {
  channelName: string;
  channelId: string;
}

interface ProjectMapping {
  projectName: string;
  projectId: string;
  accessLevel: string;
}

interface IntegrationConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  type: IntegrationTypeValue;
  agentId: string;
  agentName: string;
  existing?: Integration | null;
}

export default function IntegrationConfigDialog({
  open, onClose, onSaved, type, agentId, agentName, existing,
}: IntegrationConfigDialogProps) {
  const isEdit = !!existing;

  const existingConfig = (existing?.config ?? {}) as Record<string, unknown>;

  // Shared
  const [agentEmail, setAgentEmail] = useState((existingConfig.agentEmail as string) ?? '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slack fields
  const [slackUserId, setSlackUserId] = useState((existingConfig.agentSlackUserId as string) ?? '');
  const [slackAppId, setSlackAppId] = useState((existingConfig.appId as string) ?? '');
  const [slackTeamId, setSlackTeamId] = useState((existingConfig.teamId as string) ?? '');
  const [slackBotToken, setSlackBotToken] = useState('');
  const [slackSigningSecret, setSlackSigningSecret] = useState('');
  const [channelMappings, setChannelMappings] = useState<ChannelMapping[]>(
    () => (existingConfig.channelMappings as ChannelMapping[] | undefined) ?? [],
  );

  // GitLab fields
  const [gitlabUrl, setGitlabUrl] = useState((existingConfig.instanceUrl as string) ?? 'https://gitlab.com');
  const [gitlabUsername, setGitlabUsername] = useState((existingConfig.username as string) ?? '');
  const [gitlabToken, setGitlabToken] = useState('');
  const [projectMappings, setProjectMappings] = useState<ProjectMapping[]>(
    () => (existingConfig.projectMappings as ProjectMapping[] | undefined) ?? [],
  );

  // Google Drive fields
  const [driveIds, setDriveIds] = useState(((existingConfig.sharedDriveIds as string[]) ?? []).join(', '));
  const [folderScope, setFolderScope] = useState(((existingConfig.folderScope as string[]) ?? []).join(', '));
  const [accessType, setAccessType] = useState((existingConfig.accessType as string) ?? 'reader');

  const handleConnectGoogleDrive = () => {
    if (!existing?.id) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google OAuth Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env');
      return;
    }
    const redirectUri = `${window.location.origin}/api/integrations/google/callback`;
    const scope = 'https://www.googleapis.com/auth/drive.readonly';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(existing.id)}`;
    window.location.href = url;
  };

  // -- Channel mapping helpers --
  const addChannelMapping = () => setChannelMappings((prev) => [...prev, { channelName: '', channelId: '' }]);
  const removeChannelMapping = (idx: number) => setChannelMappings((prev) => prev.filter((_, i) => i !== idx));
  const updateChannelMapping = (idx: number, field: keyof ChannelMapping, value: string) =>
    setChannelMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  // -- Project mapping helpers --
  const addProjectMapping = () => setProjectMappings((prev) => [...prev, { projectName: '', projectId: '', accessLevel: 'developer' }]);
  const removeProjectMapping = (idx: number) => setProjectMappings((prev) => prev.filter((_, i) => i !== idx));
  const updateProjectMapping = (idx: number, field: keyof ProjectMapping, value: string) =>
    setProjectMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const handleSave = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let config: Record<string, unknown> = { agentEmail };
      let credentials: Record<string, unknown> = {};

      if (type === 'slack') {
        config = {
          ...config,
          appId: slackAppId,
          teamId: slackTeamId,
          agentSlackUserId: slackUserId,
          channelMappings: channelMappings.filter((m) => m.channelName || m.channelId),
        };
        if (slackBotToken) credentials.botToken = slackBotToken;
        if (slackSigningSecret) credentials.signingSecret = slackSigningSecret;
      } else if (type === 'gitlab') {
        config = {
          ...config,
          instanceUrl: gitlabUrl,
          username: gitlabUsername,
          projectMappings: projectMappings.filter((m) => m.projectName || m.projectId),
        };
        if (gitlabToken) credentials.accessToken = gitlabToken;
      } else if (type === 'google_drive') {
        config = {
          ...config,
          sharedDriveIds: driveIds.split(',').map(s => s.trim()).filter(Boolean),
          folderScope: folderScope.split(',').map(s => s.trim()).filter(Boolean),
          accessType,
        };
      }

      const url = isEdit ? `/api/integrations/${existing!.id}` : '/api/integrations';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { config, reason };
      if (!isEdit) {
        body.type = type;
        body.agentId = agentId;
      }
      if (Object.keys(credentials).length > 0) {
        body.credentials = credentials;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit' : 'Configure'} {INTEGRATION_LABELS[type]} for {agentName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="overline" color="text.secondary">Agent Identity</Typography>
          <TextField
            label="Agent Email"
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
            fullWidth
            placeholder="axel@fullstack.dev"
          />

          <Divider />

          {/* ---- SLACK ---- */}
          {type === 'slack' && (
            <>
              <Typography variant="overline" color="text.secondary">Slack Configuration</Typography>
              <TextField label="Slack User ID" value={slackUserId} onChange={(e) => setSlackUserId(e.target.value)} fullWidth placeholder="U0123456789" />
              <TextField label="App ID" value={slackAppId} onChange={(e) => setSlackAppId(e.target.value)} fullWidth placeholder="A0123456789" />
              <TextField label="Team ID" value={slackTeamId} onChange={(e) => setSlackTeamId(e.target.value)} fullWidth placeholder="T0123456789" />

              <Divider />
              <Typography variant="overline" color="text.secondary">Channel Mappings</Typography>
              {channelMappings.map((mapping, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label="Channel Name"
                    value={mapping.channelName}
                    onChange={(e) => updateChannelMapping(idx, 'channelName', e.target.value)}
                    size="small"
                    placeholder="#engineering"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Channel ID"
                    value={mapping.channelId}
                    onChange={(e) => updateChannelMapping(idx, 'channelId', e.target.value)}
                    size="small"
                    placeholder="C0123456789"
                    sx={{ flex: 1 }}
                  />
                  <IconButton size="small" onClick={() => removeChannelMapping(idx)} color="error">
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={addChannelMapping} sx={{ alignSelf: 'flex-start' }}>
                Add Channel
              </Button>

              <Divider />
              <Typography variant="overline" color="text.secondary">Credentials (stored server-side only)</Typography>
              <TextField
                label="Bot Token"
                type="password"
                value={slackBotToken}
                onChange={(e) => setSlackBotToken(e.target.value)}
                fullWidth
                placeholder={existing?.hasCredentials ? '••••••••  (leave blank to keep current)' : 'xoxb-...'}
                helperText={existing?.hasCredentials ? 'Leave blank to keep existing token' : undefined}
              />
              <TextField
                label="Signing Secret"
                type="password"
                value={slackSigningSecret}
                onChange={(e) => setSlackSigningSecret(e.target.value)}
                fullWidth
                placeholder={existing?.hasCredentials ? '••••••••  (leave blank to keep current)' : 'Enter signing secret'}
                helperText={existing?.hasCredentials ? 'Leave blank to keep existing secret' : undefined}
              />
            </>
          )}

          {/* ---- GITLAB ---- */}
          {type === 'gitlab' && (
            <>
              <Typography variant="overline" color="text.secondary">GitLab Configuration</Typography>
              <TextField label="Instance URL" value={gitlabUrl} onChange={(e) => setGitlabUrl(e.target.value)} fullWidth />
              <TextField label="GitLab Username" value={gitlabUsername} onChange={(e) => setGitlabUsername(e.target.value)} fullWidth placeholder="axel-agent" />

              <Divider />
              <Typography variant="overline" color="text.secondary">Project Mappings</Typography>
              {projectMappings.map((mapping, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label="Project Name"
                    value={mapping.projectName}
                    onChange={(e) => updateProjectMapping(idx, 'projectName', e.target.value)}
                    size="small"
                    placeholder="fullthrottle"
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Project ID"
                    value={mapping.projectId}
                    onChange={(e) => updateProjectMapping(idx, 'projectId', e.target.value)}
                    size="small"
                    placeholder="123"
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ flex: 1.5 }}>
                    <InputLabel>Access</InputLabel>
                    <Select
                      value={mapping.accessLevel}
                      label="Access"
                      onChange={(e) => updateProjectMapping(idx, 'accessLevel', e.target.value)}
                    >
                      <MenuItem value="guest">Guest</MenuItem>
                      <MenuItem value="reporter">Reporter</MenuItem>
                      <MenuItem value="developer">Developer</MenuItem>
                      <MenuItem value="maintainer">Maintainer</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton size="small" onClick={() => removeProjectMapping(idx)} color="error">
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={addProjectMapping} sx={{ alignSelf: 'flex-start' }}>
                Add Project
              </Button>

              <Divider />
              <Typography variant="overline" color="text.secondary">Credentials (stored server-side only)</Typography>
              <TextField
                label="Access Token"
                type="password"
                value={gitlabToken}
                onChange={(e) => setGitlabToken(e.target.value)}
                fullWidth
                placeholder={existing?.hasCredentials ? '••••••••  (leave blank to keep current)' : 'glpat-...'}
                helperText={existing?.hasCredentials ? 'Leave blank to keep existing token' : undefined}
              />
            </>
          )}

          {/* ---- GOOGLE DRIVE ---- */}
          {type === 'google_drive' && (
            <>
              <Typography variant="overline" color="text.secondary">Google Drive Configuration</Typography>
              <TextField
                label="Shared Drive IDs"
                value={driveIds}
                onChange={(e) => setDriveIds(e.target.value)}
                fullWidth
                helperText="Comma-separated (optional — for shared drives)"
              />
              <TextField
                label="Folder Scope"
                value={folderScope}
                onChange={(e) => setFolderScope(e.target.value)}
                fullWidth
                helperText="Comma-separated folder tags (e.g. architecture, sow, engineering)"
              />
              <FormControl fullWidth>
                <InputLabel>Access Type</InputLabel>
                <Select value={accessType} label="Access Type" onChange={(e) => setAccessType(e.target.value)}>
                  <MenuItem value="reader">Reader</MenuItem>
                  <MenuItem value="writer">Writer</MenuItem>
                </Select>
              </FormControl>

              <Divider />
              <Typography variant="overline" color="text.secondary">Google Account Connection</Typography>

              {existing?.hasCredentials ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Google Drive connected</Typography>
                  <Chip label="OAuth 2.0" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem', ml: 1 }} />
                  {isEdit && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleConnectGoogleDrive}
                      sx={{ ml: 'auto' }}
                    >
                      Reconnect
                    </Button>
                  )}
                </Box>
              ) : isEdit ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Authorize FullThrottle to read from your Google Drive. You will be redirected to Google to grant read-only access.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<LinkIcon />}
                    onClick={handleConnectGoogleDrive}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Connect Google Drive
                  </Button>
                </Box>
              ) : (
                <Alert severity="info" sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                  Save this integration first, then edit it to connect your Google Drive account.
                </Alert>
              )}
            </>
          )}

          <Divider />
          <TextField
            label="Reason for change (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            multiline
            minRows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!reason.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
