'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { notFound, useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import { StatusBadge } from '@/components/shared';
import IconButton from '@mui/material/IconButton';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useAgent } from '@/features/agents/hooks/useAgents';
import { uploadAgentAvatar, updateAgent } from '@/features/agents/service';
import { listOverrides } from '@/features/personas/service';
import { listTasksByOwner } from '@/features/tasks/service';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';
import type { PersonaOverride, Task } from '@/lib/types';
import PersonaEditorPanel from '@/features/personas/components/PersonaEditorPanel';
import PersonaGeneratorPrompt from '@/features/personas/components/PersonaGeneratorPrompt';
import AgentOverviewTab from '@/features/agents/components/AgentOverviewTab';
import AgentContextTab from '@/features/agents/components/AgentContextTab';

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = Number(searchParams.get('tab') ?? 0);
  const { agent, isLoading, error, refetch } = useAgent(id);
  const [tab, setTab] = useState(initialTab);
  const [editingOverrideId, setEditingOverrideId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [overrides, setOverrides] = useState<PersonaOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(true);

  const [agentTasks, setAgentTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const loadOverrides = useCallback(async () => {
    setOverridesLoading(true);
    try {
      const data = await listOverrides(id);
      setOverrides(data);
    } catch {
      setOverrides([]);
    } finally {
      setOverridesLoading(false);
    }
  }, [id]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const data = await listTasksByOwner(id);
      setAgentTasks(data);
    } catch {
      setAgentTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOverrides();
    loadTasks();
  }, [loadOverrides, loadTasks]);

  if (isLoading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!agent) {
    notFound();
  }

  const handleSaveOverride = async () => {
    setEditingOverrideId(null);
    await loadOverrides();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const accepted = ['image/png', 'image/jpeg', 'image/webp'];
    if (!accepted.includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;

    setAvatarUploading(true);
    try {
      const avatarUrl = await uploadAgentAvatar(agent.id, file);
      await updateAgent(agent.id, { avatarUrl });
      refetch();
    } catch {
      // silently fail for avatar upload
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <PageContainer>
      <Header
        title={agent.name}
        subtitle={`${agent.role} Agent`}
        breadcrumbs={[
          { label: 'Agents', href: '/agents' },
          { label: agent.name },
        ]}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={handleAvatarUpload}
            />
            <IconButton
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              sx={{ p: 0, position: 'relative' }}
              aria-label="Change avatar"
            >
              <Avatar
                src={agent.avatarUrl ?? `/agents/${agent.name.toLowerCase()}.png`}
                sx={{
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                  fontSize: '1.125rem',
                  fontWeight: 700,
                }}
              >
                {agent.name.slice(0, 2).toUpperCase()}
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
                {avatarUploading ? (
                  <CircularProgress size={20} sx={{ color: 'common.white' }} />
                ) : (
                  <CameraAltIcon sx={{ fontSize: 20, color: 'common.white' }} />
                )}
              </Box>
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <Typography variant="h2">{agent.name}</Typography>
                <StatusBadge status={agent.status} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {agent.role} &middot; Persona {agent.basePersonaVersion} &middot; {agent.provider}/{agent.defaultModel}
              </Typography>
              {agent.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {agent.description}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`${agentTasks.length} tasks`} size="small" variant="outlined" />
              <Chip label={`${overrides.length} overrides`} size="small" variant="outlined" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Persona Overrides" />
          <Tab label="Assigned Tasks" />
          <Tab label="Context" />
        </Tabs>
      </Box>

      {tab === 0 && <AgentOverviewTab agent={agent} onSaved={refetch} />}

      {tab === 1 && (
        <SectionContainer title="Persona Overrides">
          {overridesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : overrides.length === 0 ? (
            <PersonaGeneratorPrompt agentId={id} onGenerated={loadOverrides} />
          ) : (
            overrides.map((override) =>
              editingOverrideId === override.id ? (
                <Box key={override.id} sx={{ mb: 3 }}>
                  <PersonaEditorPanel
                    override={override}
                    onSave={handleSaveOverride}
                    onCancel={() => setEditingOverrideId(null)}
                  />
                </Box>
              ) : (
                <Card key={override.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={override.scopeType} size="small" variant="outlined" />
                      <Chip label={`v${override.version}`} size="small" variant="outlined" />
                      <Chip label={override.riskTolerance} size="small" variant="outlined" />
                      <Box sx={{ ml: 'auto' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setEditingOverrideId(override.id)}
                        >
                          Edit
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Scope: {override.scopeId} &middot; {override.rules.length} rules &middot; {override.skills.length} skills
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Created {new Date(override.createdAt).toLocaleDateString()}
                      {override.approvedBy ? ' · Approved' : ' · Pending approval'}
                    </Typography>
                  </CardContent>
                </Card>
              ),
            )
          )}
        </SectionContainer>
      )}

      {tab === 2 && (
        <SectionContainer title="Assigned Tasks">
          {tasksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : agentTasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No tasks assigned.</Typography>
          ) : (
            <Card>
              <List disablePadding>
                {agentTasks.map((task, idx) => (
                  <Box key={task.id}>
                    <ListItemButton sx={{ py: 1.5 }} onClick={() => router.push(`/tasks/${task.id}`)}>
                      <ListItemText
                        primary={task.title}
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={TASK_STATUS_LABELS[task.status]}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={PRIORITY_LABELS[task.priority]}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {idx < agentTasks.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Card>
          )}
        </SectionContainer>
      )}

      {tab === 3 && (
        <SectionContainer title="Context">
          <AgentContextTab agentId={id} />
        </SectionContainer>
      )}
    </PageContainer>
  );
}
