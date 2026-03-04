'use client';

import { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ViewColumnIcon from '@mui/icons-material/ViewColumnOutlined';
import ViewListIcon from '@mui/icons-material/ViewListOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { PageContainer, Header } from '@/components/layout';
import KanbanBoard from '@/features/tasks/components/KanbanBoard';
import TaskForm from '@/features/tasks/components/TaskForm';
import type { TaskFormData } from '@/features/tasks/components/TaskForm';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { createTask, updateTaskStatus } from '@/features/tasks/service';
import { useAgents } from '@/features/agents/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { listProfiles } from '@/lib/services/profiles';
import type { User } from '@/lib/types';
import {
  OwnerType,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/lib/constants';
import type { TaskStatusValue, TaskPriorityValue } from '@/lib/constants';

export default function TasksPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const { tasks, setTasks, isLoading, error, refetch } = useTasks();
  const { agents } = useAgents();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [filterOwner, setFilterOwner] = useState<string>('all');

  useEffect(() => {
    listProfiles().then(setProfiles).catch(() => {});
  }, []);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  const projectTags = useMemo(() => {
    const tags = new Set(tasks.map((t) => t.projectTag).filter(Boolean));
    return Array.from(tags).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filterOwner !== 'all') {
      result = result.filter((t) => t.ownerId === filterOwner);
    }
    if (filterPriority !== 'all') {
      result = result.filter((t) => t.priority === filterPriority);
    }
    if (filterProject !== 'all') {
      result = result.filter((t) => t.projectTag === filterProject);
    }
    return result;
  }, [tasks, filterOwner, filterPriority, filterProject]);

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of agents) map[a.id] = a.name;
    for (const p of profiles) map[p.id] = p.name;
    return map;
  }, [agents, profiles]);

  const getOwnerName = (ownerId: string) => ownerNames[ownerId] ?? ownerId;

  const handleCreateTask = async (data: TaskFormData) => {
    if (!user) return;
    try {
      const newTask = await createTask({
        title: data.title,
        description: data.description,
        ownerType: data.ownerType as 'human' | 'agent',
        ownerId: data.ownerId,
        priority: data.priority as TaskPriorityValue,
        projectTag: data.projectTag,
        createdBy: user.id,
      });
      setTasks((prev) => [newTask, ...prev]);
    } catch {
      refetch();
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatusValue) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Header title="Tasks" subtitle="Task management and Kanban board" />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Tasks"
        subtitle="Task management and Kanban board"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            New Task
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="kanban" aria-label="Kanban view">
            <ViewColumnIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">Kanban</Typography>
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">List</Typography>
          </ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Owner</InputLabel>
          <Select value={filterOwner} label="Owner" onChange={(e) => setFilterOwner(e.target.value)}>
            <MenuItem value="all">All Owners</MenuItem>
            {agents.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
            <MenuItem value="all">All Priorities</MenuItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Project</InputLabel>
          <Select value={filterProject} label="Project" onChange={(e) => setFilterProject(e.target.value)}>
            <MenuItem value="all">All Projects</MenuItem>
            {projectTags.map((tag) => (
              <MenuItem key={tag} value={tag}>{tag}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {view === 'kanban' ? (
        <KanbanBoard tasks={filteredTasks} ownerNames={ownerNames} onTaskMove={handleTaskMove} />
      ) : (
        <Card>
          <List disablePadding>
            {filteredTasks.map((task, idx) => (
              <Box key={task.id}>
                <ListItemButton sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={TASK_STATUS_LABELS[task.status]}
                          size="small" variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                        <Chip
                          icon={task.ownerType === OwnerType.AGENT ? <SmartToyIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
                          label={getOwnerName(task.ownerId)}
                          size="small" variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                        <Chip
                          label={PRIORITY_LABELS[task.priority]}
                          size="small" variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                  />
                  <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(task.createdAt).toLocaleDateString()}
                  </Typography>
                </ListItemButton>
                {idx < filteredTasks.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Card>
      )}

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreateTask} agents={agents} users={profiles} />
    </PageContainer>
  );
}
