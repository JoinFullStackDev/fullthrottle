'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import { SectionContainer } from '@/components/layout';
import MarkdownRenderer from '@/features/conversations/components/MarkdownRenderer';
import { updateTask, updateTaskStatus, assignTaskAgent } from '@/features/tasks/service';
import { listActiveProjects } from '@/features/projects/service';
import type { Project } from '@/lib/types';
import {
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  KANBAN_COLUMN_ORDER,
  OwnerType,
  KNOWN_AGENT_SLUGS,
  KNOWN_AGENT_ID_TO_SLUG,
} from '@/lib/constants';
import type { TaskStatusValue, TaskPriorityValue } from '@/lib/constants';
import type { Task, Agent, User } from '@/lib/types';

interface Props {
  task: Task;
  agents: Agent[];
  profiles: User[];
  ownerNames: Record<string, string>;
  onUpdated: () => void;
}

export default function TaskDetailOverview({ task, agents, profiles, ownerNames, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  useEffect(() => {
    listActiveProjects().then(setAvailableProjects).catch(() => {});
  }, []);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatusValue>(task.status);
  const [priority, setPriority] = useState<TaskPriorityValue>(task.priority);
  // Agent slug state (derived from ownerId for known agents)
  const [agentSlug, setAgentSlug] = useState<string>(
    task.ownerType === OwnerType.AGENT ? (KNOWN_AGENT_ID_TO_SLUG[task.ownerId] ?? '') : '',
  );
  const [projectTag, setProjectTag] = useState(task.projectTag);

  const resetForm = () => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setProjectTag(task.projectTag);
    setFeedback(null);
  };

  const handleStatusChange = async (newStatus: TaskStatusValue) => {
    setSaving(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      setStatus(newStatus);
      onUpdated();
      setFeedback({ type: 'success', message: 'Status updated.' });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAgent = async (slug: string) => {
    setAgentSlug(slug);
    if (!slug) return;
    setSaving(true);
    try {
      await assignTaskAgent(task.id, slug);
      onUpdated();
      setFeedback({ type: 'success', message: `Assigned to ${KNOWN_AGENT_SLUGS.find((a) => a.slug === slug)?.name ?? slug}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateTask(task.id, { title, description, priority, projectTag });
      if (status !== task.status) {
        await updateTaskStatus(task.id, status);
      }
      setEditing(false);
      onUpdated();
      setFeedback({ type: 'success', message: 'Task updated.' });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <SectionContainer title="Edit Task">
        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={6}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as TaskStatusValue)}>
                  {KANBAN_COLUMN_ORDER.map((s) => (
                    <MenuItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as TaskPriorityValue)}>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                    <MenuItem key={v} value={v}>{l}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Project</InputLabel>
                <Select value={projectTag} label="Project" onChange={(e) => setProjectTag(e.target.value)}>
                  <MenuItem value=""><em>No project</em></MenuItem>
                  {availableProjects.map((p) => (
                    <MenuItem key={p.slug} value={p.slug}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={() => { resetForm(); setEditing(false); }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? <CircularProgress size={20} /> : 'Save'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </SectionContainer>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {feedback && (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <SectionContainer
        title="Description"
        actions={
          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
            Edit
          </Button>
        }
      >
        <Card>
          <CardContent>
            {task.description ? (
              <MarkdownRenderer content={task.description} />
            ) : (
              <Typography variant="body2" color="text.secondary">No description.</Typography>
            )}
          </CardContent>
        </Card>
      </SectionContainer>

      <SectionContainer title="Quick Actions">
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatusValue)}
                  disabled={saving}
                >
                  {KANBAN_COLUMN_ORDER.map((s) => (
                    <MenuItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Assign Agent</InputLabel>
                <Select
                  value={agentSlug}
                  label="Assign Agent"
                  onChange={(e) => handleAssignAgent(e.target.value)}
                  disabled={saving}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {KNOWN_AGENT_SLUGS.map((a) => (
                    <MenuItem key={a.slug} value={a.slug}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </SectionContainer>
    </Box>
  );
}
