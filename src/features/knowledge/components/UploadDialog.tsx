'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import type { Agent, Project } from '@/lib/types';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  projects: Project[];
  agents: Agent[];
}

export default function UploadDialog({
  open,
  onClose,
  onUploadComplete,
  projects,
  agents,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [folderTag, setFolderTag] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [agentId, setAgentId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setFile(null);
    setName('');
    setFolderTag('');
    setProjectTag('');
    setAgentId('');
    setError(null);
    onClose();
  };

  const handleUpload = async () => {
    if (!file || !projectTag) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name || file.name);
      if (folderTag) formData.append('folderTag', folderTag);
      formData.append('projectTag', projectTag);
      if (agentId) formData.append('agentId', agentId);

      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Upload failed: ${res.status}`);
      }
      onUploadComplete();
      resetAndClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={resetAndClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {file ? file.name : 'Choose a file (.txt, .md, .csv, .json, .yaml, .pdf)'}
            <input
              type="file"
              hidden
              accept=".txt,.md,.csv,.json,.yaml,.yml,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
                }
              }}
            />
          </Button>

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="Document name (auto-filled from file)"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Folder Tag"
              value={folderTag}
              onChange={(e) => setFolderTag(e.target.value)}
              size="small"
              fullWidth
              placeholder="architecture, sow, qa"
            />
            <FormControl size="small" fullWidth required>
              <InputLabel>Project</InputLabel>
              <Select
                value={projectTag}
                label="Project"
                onChange={(e) => setProjectTag(e.target.value)}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.slug}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>Assign to Agent</InputLabel>
            <Select value={agentId} label="Assign to Agent" onChange={(e) => setAgentId(e.target.value)}>
              <MenuItem value="">All Agents</MenuItem>
              {agents.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.role})</MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={resetAndClose} variant="outlined" color="inherit">Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || !projectTag || uploading}
          startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
