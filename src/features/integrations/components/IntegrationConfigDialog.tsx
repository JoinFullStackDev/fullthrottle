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
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import type { IntegrationTypeValue } from '@/lib/constants';
import { INTEGRATION_LABELS } from '@/lib/constants';
import type { Integration } from '@/lib/types';

const STEPS = ['Credentials', 'Group', 'Projects', 'Confirm'];

interface VerifiedUser {
  id: number;
  username: string;
  name: string;
}

interface GitLabGroup {
  id: number;
  name: string;
  fullPath: string;
  webUrl: string;
}

interface GitLabProject {
  id: number;
  name: string;
  pathWithNamespace: string;
  webUrl: string;
  description: string;
}

interface ProjectMapping {
  projectName: string;
  projectId: string;
  pathWithNamespace: string;
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

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 0 — Credentials
  const [gitlabUrl, setGitlabUrl] = useState(
    (existingConfig.instanceUrl as string) ?? 'https://gitlab.com',
  );
  const [gitlabToken, setGitlabToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);
  const [groups, setGroups] = useState<GitLabGroup[]>([]);

  // Step 1 — Group
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [fetchingProjects, setFetchingProjects] = useState(false);

  // Step 2 — Projects
  const [availableProjects, setAvailableProjects] = useState<GitLabProject[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());

  // Step 3 — Confirm
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch('/api/integrations/gitlab/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceUrl: gitlabUrl, accessToken: gitlabToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setVerifiedUser(data.user);
      setGroups(data.groups);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  const handleGroupSelect = async (groupId: number) => {
    setSelectedGroupId(groupId);
    setError(null);
    setFetchingProjects(true);
    setAvailableProjects([]);
    setSelectedProjectIds(new Set());

    try {
      const res = await fetch('/api/integrations/gitlab/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: gitlabUrl,
          accessToken: gitlabToken,
          groupId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch projects');

      setAvailableProjects(data.projects);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setFetchingProjects(false);
    }
  };

  const toggleProject = (id: number) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const projectMappings: ProjectMapping[] = availableProjects
        .filter((p) => selectedProjectIds.has(p.id))
        .map((p) => ({
          projectName: p.name,
          projectId: String(p.id),
          pathWithNamespace: p.pathWithNamespace,
        }));

      const config = {
        instanceUrl: gitlabUrl,
        defaultNamespace: selectedGroup?.fullPath ?? '',
        groupId: selectedGroupId,
        verifiedUser: verifiedUser?.username ?? '',
        projectMappings,
      };

      const credentials: Record<string, unknown> = {};
      if (gitlabToken) credentials.accessToken = gitlabToken;

      const url = isEdit ? `/api/integrations/${existing!.id}` : '/api/integrations';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { config, status: 'connected', reason };
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

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 0: return !!verifiedUser;
      case 1: return selectedGroupId !== '' && availableProjects.length > 0 && !fetchingProjects;
      case 2: return selectedProjectIds.size > 0;
      case 3: return reason.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (activeStep > 0) setActiveStep((s) => s - 1);
  };

  const selectedProjectList = availableProjects.filter((p) => selectedProjectIds.has(p.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit' : 'Configure'} {INTEGRATION_LABELS[type]} Connection
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Step 0: Credentials */}
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="overline" color="text.secondary">
                GitLab API Credentials
              </Typography>
              <TextField
                label="Instance URL"
                value={gitlabUrl}
                onChange={(e) => { setGitlabUrl(e.target.value); setVerifiedUser(null); }}
                fullWidth
                placeholder="https://gitlab.com"
                disabled={verifying}
              />
              <TextField
                label="Personal Access Token"
                type="password"
                value={gitlabToken}
                onChange={(e) => { setGitlabToken(e.target.value); setVerifiedUser(null); }}
                fullWidth
                placeholder={isEdit && existing?.hasCredentials ? '••••••••  (enter new token to re-verify)' : 'glpat-...'}
                helperText="Requires api scope. Created at GitLab > Preferences > Access Tokens."
                disabled={verifying}
              />

              {verifiedUser ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                  <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Verified as <strong>{verifiedUser.name}</strong> (@{verifiedUser.username})
                  </Typography>
                  <Chip label={`${groups.length} group${groups.length !== 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ ml: 'auto', height: 22 }} />
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleVerify}
                  disabled={!gitlabUrl.trim() || !gitlabToken.trim() || verifying}
                  startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : undefined}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {verifying ? 'Verifying...' : 'Verify Connection'}
                </Button>
              )}
            </Box>
          )}

          {/* Step 1: Group */}
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Select Group
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the GitLab group to sync projects from.
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Group</InputLabel>
                <Select
                  value={selectedGroupId}
                  label="Group"
                  onChange={(e) => handleGroupSelect(e.target.value as number)}
                >
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name} <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>{g.fullPath}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {fetchingProjects && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">Loading projects...</Typography>
                </Box>
              )}

              {!fetchingProjects && selectedGroupId !== '' && availableProjects.length === 0 && (
                <Typography variant="body2" color="text.disabled">
                  No projects found in this group.
                </Typography>
              )}

              {!fetchingProjects && availableProjects.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {availableProjects.length} project{availableProjects.length !== 1 ? 's' : ''} found. Continue to select which to sync.
                </Typography>
              )}
            </Box>
          )}

          {/* Step 2: Projects */}
          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="overline" color="text.secondary">
                Select Projects
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Check the projects to sync with the Control Center.
              </Typography>
              <List dense sx={{ maxHeight: 320, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {availableProjects.map((p) => (
                  <ListItem key={p.id} disablePadding>
                    <ListItemButton onClick={() => toggleProject(p.id)} dense>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={selectedProjectIds.has(p.id)}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={p.name}
                        secondary={p.pathWithNamespace}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {selectedProjectIds.size} of {availableProjects.length} selected
              </Typography>
            </Box>
          )}

          {/* Step 3: Confirm */}
          {activeStep === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Review & Save
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Row label="Instance" value={gitlabUrl} />
                <Row label="User" value={`${verifiedUser?.name} (@${verifiedUser?.username})`} />
                <Row label="Group" value={selectedGroup?.fullPath ?? ''} />
                <Row label="Projects" value={`${selectedProjectIds.size} selected`} />
                {selectedProjectList.map((p) => (
                  <Typography key={p.id} variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                    {p.pathWithNamespace}
                  </Typography>
                ))}
              </Box>

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
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} variant="outlined" color="inherit" disabled={saving}>
              Back
            </Button>
          )}
          {activeStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceed(activeStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!canProceed(activeStep) || saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
