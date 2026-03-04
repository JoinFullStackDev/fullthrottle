'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import EditIcon from '@mui/icons-material/Edit';
import { StatusBadge } from '@/components/shared';
import { updateAgent } from '@/features/agents/service';
import { useAuth } from '@/hooks/useAuth';
import { AgentStatus } from '@/lib/constants';
import type { AgentStatusValue } from '@/lib/constants';
import type { Agent } from '@/lib/types';
import { PROVIDER_MODELS, PROVIDER_OPTIONS } from '@/lib/provider-models';
import { SectionContainer } from '@/components/layout';

const STATUS_OPTIONS: { value: AgentStatusValue; label: string }[] = [
  { value: AgentStatus.OFFLINE, label: 'Offline' },
  { value: AgentStatus.ACTIVE, label: 'Active' },
  { value: AgentStatus.DISABLED, label: 'Disabled' },
  { value: AgentStatus.PLANNED, label: 'Planned' },
];

interface AgentOverviewTabProps {
  agent: Agent;
  onSaved: () => void;
}

export default function AgentOverviewTab({ agent, onSaved }: AgentOverviewTabProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [description, setDescription] = useState(agent.description);
  const [provider, setProvider] = useState(agent.provider);
  const [defaultModel, setDefaultModel] = useState(agent.defaultModel);
  const [basePersonaVersion, setBasePersonaVersion] = useState(agent.basePersonaVersion);
  const [status, setStatus] = useState<AgentStatusValue>(agent.status);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const resetForm = () => {
    setName(agent.name);
    setRole(agent.role);
    setDescription(agent.description);
    setProvider(agent.provider);
    setDefaultModel(agent.defaultModel);
    setBasePersonaVersion(agent.basePersonaVersion);
    setStatus(agent.status);
    setFeedback(null);
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !role.trim()) {
      setFeedback({ type: 'error', message: 'Name and Role are required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await updateAgent(
        agent.id,
        {
          name: name.trim(),
          role: role.trim(),
          description: description.trim(),
          provider,
          defaultModel,
          basePersonaVersion: basePersonaVersion.trim() || 'v1.0',
          status,
        },
        user ? { actorId: user.id, reason: 'Agent updated via Control Center' } : undefined,
      );
      setFeedback({ type: 'success', message: 'Agent updated.' });
      setEditing(false);
      onSaved();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <SectionContainer title="Agent Details">
        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                Edit
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body2">{agent.name}</Typography>
              <Typography variant="caption" color="text.secondary">Role</Typography>
              <Typography variant="body2">{agent.role}</Typography>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography variant="body2">{agent.description || 'No description'}</Typography>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Box><StatusBadge status={agent.status} /></Box>
              <Typography variant="caption" color="text.secondary">Persona Version</Typography>
              <Typography variant="body2">{agent.basePersonaVersion}</Typography>
              <Typography variant="caption" color="text.secondary">Provider</Typography>
              <Typography variant="body2">{agent.provider}</Typography>
              <Typography variant="caption" color="text.secondary">Default Model</Typography>
              <Typography variant="body2">{agent.defaultModel}</Typography>
              <Typography variant="caption" color="text.secondary">Runtime Agent ID</Typography>
              <Typography variant="body2" color="text.disabled">
                {agent.runtimeAgentId ?? 'Not connected'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">{new Date(agent.createdAt).toLocaleDateString()}</Typography>
            </Box>
          </CardContent>
        </Card>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer title="Edit Agent">
      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
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
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} /> : undefined}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
