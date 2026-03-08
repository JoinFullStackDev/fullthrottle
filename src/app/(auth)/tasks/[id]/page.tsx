'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined';
import CallSplitIcon from '@mui/icons-material/CallSplitOutlined';
import InputIcon from '@mui/icons-material/InputOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import { getTaskById } from '@/features/tasks/service';
import { useAgents } from '@/features/agents/hooks/useAgents';
import { listProfiles } from '@/lib/services/profiles';
import {
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  OwnerType,
} from '@/lib/constants';
import type { TaskPriorityValue } from '@/lib/constants';
import type { Task, User } from '@/lib/types';
import TaskDetailOverview from '@/features/tasks/components/TaskDetailOverview';
import TaskDetailMeta from '@/features/tasks/components/TaskDetailMeta';
import TaskRelatedTasks from '@/features/tasks/components/TaskRelatedTasks';
import TaskActivityLog from '@/features/tasks/components/TaskActivityLog';

const PRIORITY_COLORS: Record<TaskPriorityValue, string> = {
  low: '#9E9EB0',
  medium: '#5C6BC0',
  high: '#C9A84C',
  critical: '#CF6679',
};

const AGENT_LABELS: Record<string, string> = {
  axel: 'Axel (Engineering)',
  riff: 'Riff (Product)',
  torque: 'Torque (QA)',
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const { agents } = useAgents();
  const [profiles, setProfiles] = useState<User[]>([]);

  const loadTask = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTaskById(id);
      setTask(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
    listProfiles().then(setProfiles).catch(() => {});
  }, [loadTask]);

  const ownerNames: Record<string, string> = {};
  for (const a of agents) ownerNames[a.id] = a.name;
  for (const p of profiles) ownerNames[p.id] = p.name;

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

  if (!task) {
    notFound();
  }

  const intakeType = task.metadata?.intakeType as string | undefined;
  const suggestedAgent = task.metadata?.suggestedAgent as string | undefined;
  const ownerName = task.ownerId ? ownerNames[task.ownerId] : null;
  const isUnassigned = !task.ownerId;
  const hasDetails = !!intakeType;
  const hasRelated = !!task.parentTaskId || intakeType === 'parent';

  return (
    <PageContainer>
      <Header
        title={task.title}
        breadcrumbs={[
          { label: 'Tasks', href: '/tasks' },
          { label: task.title },
        ]}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              label={TASK_STATUS_LABELS[task.status]}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={PRIORITY_LABELS[task.priority]}
              size="small"
              variant="outlined"
              sx={{
                borderColor: PRIORITY_COLORS[task.priority],
                color: PRIORITY_COLORS[task.priority],
              }}
            />
            <Chip
              icon={task.ownerType === OwnerType.AGENT ? <SmartToyIcon sx={{ fontSize: 16 }} /> : <PersonIcon sx={{ fontSize: 16 }} />}
              label={isUnassigned ? 'Unassigned' : ownerName ?? task.ownerId}
              size="small"
              variant="outlined"
              sx={isUnassigned ? { borderStyle: 'dashed', color: 'text.disabled' } : {}}
            />
            {task.projectTag && (
              <Chip label={task.projectTag} size="small" variant="outlined" />
            )}
            {intakeType === 'parent' && (
              <Chip
                icon={<InputIcon sx={{ fontSize: 16 }} />}
                label="Intake"
                size="small"
                sx={{ bgcolor: 'action.selected' }}
              />
            )}
            {intakeType === 'derived' && (
              <Chip
                icon={<CallSplitIcon sx={{ fontSize: 16 }} />}
                label="Derived from intake"
                size="small"
                sx={{ bgcolor: 'action.selected' }}
              />
            )}
            {suggestedAgent && isUnassigned && (
              <Chip
                icon={<LightbulbIcon sx={{ fontSize: 16 }} />}
                label={`Suggested: ${AGENT_LABELS[suggestedAgent] ?? suggestedAgent}`}
                size="small"
                sx={{ borderColor: 'primary.main', color: 'primary.light' }}
                variant="outlined"
              />
            )}

            <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Created {new Date(task.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Updated {new Date(task.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          {hasDetails && <Tab label="Details" />}
          {hasRelated && <Tab label="Related Tasks" />}
          <Tab label="Activity" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <TaskDetailOverview
          task={task}
          agents={agents}
          profiles={profiles}
          ownerNames={ownerNames}
          onUpdated={loadTask}
        />
      )}
      {hasDetails && tab === 1 && (
        <TaskDetailMeta task={task} />
      )}
      {hasRelated && tab === (hasDetails ? 2 : 1) && (
        <TaskRelatedTasks task={task} ownerNames={ownerNames} />
      )}
      {tab === (hasDetails ? (hasRelated ? 3 : 2) : (hasRelated ? 2 : 1)) && (
        <TaskActivityLog taskId={task.id} />
      )}
    </PageContainer>
  );
}
