'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
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
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import StorageIcon from '@mui/icons-material/StorageOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import LinkIcon from '@mui/icons-material/LinkOutlined';
import {
  createKnowledgeSource,
  refreshKnowledgeSource,
  discoverDriveContents,
  discoverDriveRoots,
} from '@/features/knowledge/service';
import { listIntegrationsByType } from '@/features/integrations/service';
import type { Agent, Project } from '@/lib/types';

interface DriveBrowserDialogProps {
  open: boolean;
  onClose: () => void;
  onRegisterComplete: () => void;
  projects: Project[];
  agents: Agent[];
}

type DriveRoot = { id: string; name: string; kind: string };
type PathEntry = { id: string; name: string };
type DriveFolder = { id: string; name: string };
type DriveFile = { id: string; name: string; mimeType: string; modifiedTime: string; supported: boolean; isFolder: boolean };

export default function DriveBrowserDialog({
  open,
  onClose,
  onRegisterComplete,
  projects,
  agents,
}: DriveBrowserDialogProps) {
  const [intId, setIntId] = useState('');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [folderTag, setFolderTag] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [agentId, setAgentId] = useState('');

  const [roots, setRoots] = useState<DriveRoot[]>([]);
  const [path, setPath] = useState<PathEntry[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [discovering, setDiscovering] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [rootsLoaded, setRootsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initRef = useRef(false);

  const initDrive = useCallback(async () => {
    setDiscovering(true);
    setError(null);
    setConnected(null);
    setRootsLoaded(false);
    setPath([]);
    setFolders([]);
    setFiles([]);
    setSelectedIds(new Set());

    try {
      const ints = await listIntegrationsByType('google_drive');
      const systemInt = ints.find((i) => !i.agentId && i.hasCredentials);

      if (!systemInt) {
        setConnected(false);
        return;
      }

      setIntId(systemInt.id);
      setConnected(true);

      const driveRoots = await discoverDriveRoots(systemInt.id);
      setRoots(driveRoots);
      setRootsLoaded(true);
    } catch (err) {
      setError((err as Error).message);
      setConnected(true);
    } finally {
      setDiscovering(false);
    }
  }, []);

  useEffect(() => {
    if (open && !initRef.current) {
      initRef.current = true;
      initDrive();
    }
    if (!open) {
      initRef.current = false;
    }
  }, [open, initDrive]);

  const handleNavigate = async (folderId: string, folderName: string, isRoot = false) => {
    setDiscovering(true);
    setError(null);
    setFiles([]);
    setFolders([]);
    setSelectedIds(new Set());

    if (isRoot) {
      setPath([{ id: folderId, name: folderName }]);
    } else {
      setPath((prev) => [...prev, { id: folderId, name: folderName }]);
    }

    try {
      const result = await discoverDriveContents(intId, folderId);
      setFolders(result.folders);
      setFiles(result.files);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleBreadcrumb = async (index: number) => {
    const target = path[index];
    setPath((prev) => prev.slice(0, index + 1));
    setDiscovering(true);
    setError(null);
    setFiles([]);
    setFolders([]);
    setSelectedIds(new Set());
    try {
      const result = await discoverDriveContents(intId, target.id);
      setFolders(result.folders);
      setFiles(result.files);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleBack = () => {
    if (path.length <= 1) {
      setPath([]);
      setFolders([]);
      setFiles([]);
      return;
    }
    handleBreadcrumb(path.length - 2);
  };

  const toggleFile = (fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleRegister = async () => {
    if (selectedIds.size === 0) return;
    setRegistering(true);
    try {
      const selectedFiles = files.filter((f) => selectedIds.has(f.id));
      for (const file of selectedFiles) {
        const newSource = await createKnowledgeSource({
          name: file.name,
          type: 'Document',
          path: file.id,
          sourceType: 'google_drive',
          externalId: file.id,
          integrationId: intId,
          agentId: agentId || null,
          folderTag: folderTag || null,
          projectTag: projectTag || null,
          refreshIntervalMinutes: 60,
          mimeType: file.mimeType,
        });
        try {
          await refreshKnowledgeSource(newSource.id);
        } catch {
          // Non-fatal: source is registered, content fetch can be retried
        }
      }
      onRegisterComplete();
      onClose();
    } catch {
      // ignore
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Browse Google Drive</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {connected === false && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
              <LinkIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Google Drive is not connected. Connect your account from the Integrations page to browse files.
              </Typography>
              <Button
                variant="contained"
                size="small"
                href="/integrations"
              >
                Go to Integrations
              </Button>
            </Box>
          )}

          {connected === true && (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Folder Tag"
                  value={folderTag}
                  onChange={(e) => setFolderTag(e.target.value)}
                  size="small"
                  placeholder="architecture, sow, qa"
                  helperText="Applied to all selected files"
                />
                <FormControl size="small" sx={{ minWidth: 180 }} required>
                  <InputLabel>Project</InputLabel>
                  <Select value={projectTag} label="Project" onChange={(e) => setProjectTag(e.target.value)}>
                    {projects.map((p) => (
                      <MenuItem key={p.id} value={p.slug}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Assign to Agent</InputLabel>
                  <Select value={agentId} label="Assign to Agent" onChange={(e) => setAgentId(e.target.value)}>
                    <MenuItem value="">All Agents</MenuItem>
                    {agents.map((a) => (
                      <MenuItem key={a.id} value={a.id}>{a.name} ({a.role})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Typography variant="caption" color="text.disabled">
                Assigning a project helps organize sources. All knowledge remains globally accessible to Clutch regardless of project or agent assignment.
              </Typography>
            </>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {discovering && !rootsLoaded && path.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {rootsLoaded && path.length === 0 && (
            <Card variant="outlined">
              <List disablePadding>
                {roots.map((root, idx) => (
                  <Box key={root.id}>
                    <ListItemButton onClick={() => handleNavigate(root.id, root.name, true)} sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {root.kind === 'shared_drive' ? <StorageIcon fontSize="small" /> : <FolderOpenIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={500}>{root.name}</Typography>}
                        secondary={<Typography variant="caption" color="text.disabled">{root.kind === 'shared_drive' ? 'Shared Drive' : 'Personal Drive'}</Typography>}
                      />
                    </ListItemButton>
                    {idx < roots.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Card>
          )}

          {path.length > 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={handleBack}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Breadcrumbs sx={{ fontSize: '0.8rem' }}>
                  {path.map((crumb, idx) => (
                    idx < path.length - 1 ? (
                      <Link
                        key={crumb.id}
                        component="button"
                        variant="caption"
                        onClick={() => handleBreadcrumb(idx)}
                        underline="hover"
                        color="text.secondary"
                        sx={{ cursor: 'pointer' }}
                      >
                        {crumb.name}
                      </Link>
                    ) : (
                      <Typography key={crumb.id} variant="caption" fontWeight={600}>{crumb.name}</Typography>
                    )
                  ))}
                </Breadcrumbs>
              </Box>

              {discovering ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Card variant="outlined" sx={{ maxHeight: 380, overflow: 'auto' }}>
                  {folders.length > 0 && (
                    <List disablePadding>
                      {folders.map((folder) => (
                        <ListItemButton key={folder.id} onClick={() => handleNavigate(folder.id, folder.name)} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FolderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">{folder.name}</Typography>} />
                        </ListItemButton>
                      ))}
                      {files.length > 0 && <Divider />}
                    </List>
                  )}

                  {files.length > 0 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={files.filter((f) => f.supported).length > 0 && files.filter((f) => f.supported).every((f) => selectedIds.has(f.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(new Set(files.filter((f) => f.supported).map((f) => f.id)));
                                } else {
                                  setSelectedIds(new Set());
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Modified</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {files.map((file) => (
                          <TableRow key={file.id} hover sx={{ opacity: file.supported ? 1 : 0.5 }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedIds.has(file.id)}
                                onChange={() => toggleFile(file.id)}
                                disabled={!file.supported}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DescriptionIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                <Typography variant="body2">{file.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {file.mimeType.replace('application/vnd.google-apps.', '')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.disabled">
                                {new Date(file.modifiedTime).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {folders.length === 0 && files.length === 0 && !discovering && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">This folder is empty</Typography>
                    </Box>
                  )}
                </Card>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
        <Button
          onClick={handleRegister}
          variant="contained"
          disabled={selectedIds.size === 0 || registering || !projectTag}
          startIcon={registering ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Register {selectedIds.size > 0 ? `${selectedIds.size} File${selectedIds.size > 1 ? 's' : ''}` : 'Selected'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
