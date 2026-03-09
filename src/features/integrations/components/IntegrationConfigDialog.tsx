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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import RemoveIcon from '@mui/icons-material/RemoveCircleOutline';
import type { IntegrationTypeValue } from '@/lib/constants';
import { INTEGRATION_LABELS } from '@/lib/constants';
import type { Integration } from '@/lib/types';

interface ProjectMapping {
  projectName: string;
  projectId: string;
}

interface IntegrationConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  type: IntegrationTypeValue;
  existing?: Integration | null;
}

export default function IntegrationConfigDialog({
  open, onClose, onSaved, type, existing,
}: IntegrationConfigDialogProps) {
  const isEdit = !!existing;

  const existingConfig = (existing?.config ?? {}) as Record<string, unknown>;

  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gitlabUrl, setGitlabUrl] = useState((existingConfig.instanceUrl as string) ?? 'https://gitlab.com');
  const [defaultNamespace, setDefaultNamespace] = useState((existingConfig.defaultNamespace as string) ?? '');
  const [gitlabToken, setGitlabToken] = useState('');
  const [projectMappings, setProjectMappings] = useState<ProjectMapping[]>(
    () => ((existingConfig.projectMappings as ProjectMapping[] | undefined) ?? []).map(
      (m) => ({ projectName: m.projectName, projectId: m.projectId }),
    ),
  );

  const addProjectMapping = () => setProjectMappings((prev) => [...prev, { projectName: '', projectId: '' }]);
  const removeProjectMapping = (idx: number) => setProjectMappings((prev) => prev.filter((_, i) => i !== idx));
  const updateProjectMapping = (idx: number, field: keyof ProjectMapping, value: string) =>
    setProjectMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const handleSave = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const config: Record<string, unknown> = {
        instanceUrl: gitlabUrl,
        defaultNamespace,
        projectMappings: projectMappings.filter((m) => m.projectName || m.projectId),
      };
      const credentials: Record<string, unknown> = {};
      if (gitlabToken) credentials.accessToken = gitlabToken;

      const url = isEdit ? `/api/integrations/${existing!.id}` : '/api/integrations';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { config, reason };
      if (!isEdit) {
        body.type = type;
        body.agentId = null;
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
        {isEdit ? 'Edit' : 'Configure'} {INTEGRATION_LABELS[type]} Connection
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="overline" color="text.secondary">GitLab API Configuration</Typography>
          <TextField
            label="Instance URL"
            value={gitlabUrl}
            onChange={(e) => setGitlabUrl(e.target.value)}
            fullWidth
            placeholder="https://gitlab.com"
          />
          <TextField
            label="Default Group / Namespace"
            value={defaultNamespace}
            onChange={(e) => setDefaultNamespace(e.target.value)}
            fullWidth
            placeholder="fullstack/projects"
            helperText="Scope API operations to this group or namespace"
          />

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
            label="API Token"
            type="password"
            value={gitlabToken}
            onChange={(e) => setGitlabToken(e.target.value)}
            fullWidth
            placeholder={existing?.hasCredentials ? '••••••••  (leave blank to keep current)' : 'glpat-...'}
            helperText={existing?.hasCredentials ? 'Leave blank to keep existing token' : 'Project or group access token'}
          />

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
