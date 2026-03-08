'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { OwnerType, TaskPriority, PRIORITY_LABELS } from '@/lib/constants';
import type { OwnerTypeValue, TaskPriorityValue } from '@/lib/constants';
import type { Agent, User, Project } from '@/lib/types';
import { listActiveProjects } from '@/features/projects/service';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: TaskFormData) => void;
  agents?: Agent[];
  users?: User[];
}

export interface TaskFormData {
  title: string;
  description: string;
  ownerType: string;
  ownerId: string;
  priority: string;
  projectTag: string;
}

export default function TaskForm({ open, onClose, onSubmit, agents = [], users = [] }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerType, setOwnerType] = useState<OwnerTypeValue>(OwnerType.HUMAN);
  const [ownerId, setOwnerId] = useState('');
  const [priority, setPriority] = useState<TaskPriorityValue>(TaskPriority.MEDIUM);
  const [projectTag, setProjectTag] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (open) {
      listActiveProjects().then(setProjects).catch(() => {});
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit?.({ title, description, ownerType, ownerId, priority, projectTag });
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setOwnerType(OwnerType.HUMAN);
    setOwnerId('');
    setPriority(TaskPriority.MEDIUM);
    setProjectTag('');
  };

  const owners =
    ownerType === OwnerType.AGENT
      ? agents.map((a) => ({ id: a.id, label: a.name }))
      : users.map((u) => ({ id: u.id, label: u.name }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Owner Type</InputLabel>
              <Select
                value={ownerType}
                label="Owner Type"
                onChange={(e) => {
                  setOwnerType(e.target.value as typeof ownerType);
                  setOwnerId('');
                }}
              >
                <MenuItem value={OwnerType.HUMAN}>Human</MenuItem>
                <MenuItem value={OwnerType.AGENT}>Agent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Owner</InputLabel>
              <Select
                value={ownerId}
                label="Owner"
                onChange={(e) => setOwnerId(e.target.value)}
              >
                {owners.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as typeof priority)}
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={projectTag}
                label="Project"
                onChange={(e) => setProjectTag(e.target.value)}
              >
                <MenuItem value="">
                  <em>No project</em>
                </MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.slug} value={p.slug}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()}>
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
