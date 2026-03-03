'use client';

import { useState, useMemo } from 'react';
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
import ViewColumnIcon from '@mui/icons-material/ViewColumnOutlined';
import ViewListIcon from '@mui/icons-material/ViewListOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { PageContainer, Header } from '@/components/layout';
import KanbanBoard from '@/features/tasks/components/KanbanBoard';
import TaskForm from '@/features/tasks/components/TaskForm';
import type { TaskFormData } from '@/features/tasks/components/TaskForm';
import { MOCK_TASKS } from '@/features/tasks/mock-data';
import { MOCK_AGENTS, getAgentName } from '@/features/agents/mock-data';
import {
  OwnerType,
  TaskStatus,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/lib/constants';
import type { Task } from '@/lib/types';
import type { TaskStatusValue, TaskPriorityValue, OwnerTypeValue } from '@/lib/constants';

export default function TasksPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([...MOCK_TASKS]);
  const [filterOwner, setFilterOwner] = useState<string>('all');
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

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description,
      status: TaskStatus.BACKLOG,
      ownerType: data.ownerType as OwnerTypeValue,
      ownerId: data.ownerId,
      priority: data.priority as TaskPriorityValue,
      projectTag: data.projectTag,
      runtimeRunId: null,
      lastRuntimeStatus: null,
      createdBy: 'user-spencer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatusValue) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <PageContainer>
      <Header
        title="Tasks"
        subtitle="Task management and Kanban board"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            New Task
          </Button>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
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
          <Select
            value={filterOwner}
            label="Owner"
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <MenuItem value="all">All Owners</MenuItem>
            {MOCK_AGENTS.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
            ))}
            <MenuItem value="user-spencer">Spencer</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filterPriority}
            label="Priority"
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Project</InputLabel>
          <Select
            value={filterProject}
            label="Project"
            onChange={(e) => setFilterProject(e.target.value)}
          >
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
        <KanbanBoard tasks={filteredTasks} onTaskMove={handleTaskMove} />
      ) : (
        <Card>
          <List disablePadding>
            {filteredTasks.map((task, idx) => {
              const ownerName =
                task.ownerType === OwnerType.AGENT
                  ? getAgentName(task.ownerId)
                  : task.ownerId.replace('user-', '');
              return (
                <Box key={task.id}>
                  <ListItemButton sx={{ py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {task.title}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={TASK_STATUS_LABELS[task.status]}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                          <Chip
                            icon={
                              task.ownerType === OwnerType.AGENT
                                ? <SmartToyIcon sx={{ fontSize: 14 }} />
                                : <PersonIcon sx={{ fontSize: 14 }} />
                            }
                            label={ownerName}
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
                    <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </Typography>
                  </ListItemButton>
                  {idx < filteredTasks.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        </Card>
      )}

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreateTask} />
    </PageContainer>
  );
}
