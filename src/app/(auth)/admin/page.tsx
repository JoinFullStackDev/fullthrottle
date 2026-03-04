'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import TokenIcon from '@mui/icons-material/TokenOutlined';
import MoneyOffIcon from '@mui/icons-material/MoneyOffOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/RefreshOutlined';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import StorageIcon from '@mui/icons-material/StorageOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import HelpIcon from '@mui/icons-material/HelpOutlineOutlined';
import Checkbox from '@mui/material/Checkbox';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import UsageStatBlock from '@/features/usage/components/UsageStatBlock';
import { listAuditLogs } from '@/features/audit/service';
import {
  listKnowledgeSources,
  createKnowledgeSource,
  deleteKnowledgeSource,
  refreshKnowledgeSource,
  discoverDriveContents,
  discoverDriveRoots,
} from '@/features/knowledge/service';
import { listIntegrationsByType } from '@/features/integrations/service';
import { listProfiles } from '@/lib/services/profiles';
import { listAgents } from '@/features/agents/service';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/permissions';
import { ROLE_LABELS, UserRole } from '@/lib/constants';
import type { UserRoleValue } from '@/lib/constants';
import type { AuditLogEntry, KnowledgeSource, User, Agent, Integration } from '@/lib/types';

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const { user: currentUser } = useAuth();

  // ===== Dev Seed =====
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<string[] | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    setSeedError(null);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSeedError(data.error || 'Seed failed');
      } else {
        setSeedResult(data.results);
      }
    } catch (err) {
      setSeedError((err as Error).message);
    } finally {
      setSeedLoading(false);
    }
  };

  // ===== Profiles (shared by audit filters + users tab) =====
  const [profiles, setProfiles] = useState<User[]>([]);
  useEffect(() => {
    listProfiles().then(setProfiles).catch(() => {});
  }, []);

  // ===== Audit Log state =====
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditFilterActor, setAuditFilterActor] = useState('all');
  const [auditFilterAction, setAuditFilterAction] = useState('all');
  const [auditFilterEntity, setAuditFilterEntity] = useState('all');

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await listAuditLogs({
        actorId: auditFilterActor !== 'all' ? auditFilterActor : undefined,
        actionType: auditFilterAction !== 'all' ? auditFilterAction : undefined,
        entityType: auditFilterEntity !== 'all' ? auditFilterEntity : undefined,
        limit: 100,
      });
      setAuditLogs(data);
      setAuditError(null);
    } catch (err) {
      setAuditError((err as Error).message);
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilterActor, auditFilterAction, auditFilterEntity]);

  useEffect(() => { loadAuditLogs(); }, [loadAuditLogs]);

  const [allActionTypes, setAllActionTypes] = useState<string[]>([]);
  const [allEntityTypes, setAllEntityTypes] = useState<string[]>([]);
  useEffect(() => {
    listAuditLogs({ limit: 500 }).then((logs) => {
      setAllActionTypes(Array.from(new Set(logs.map((l) => l.actionType))).sort());
      setAllEntityTypes(Array.from(new Set(logs.map((l) => l.entityType))).sort());
    }).catch(() => {});
  }, []);

  // ===== Knowledge Sources state =====
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [ksLoading, setKsLoading] = useState(true);
  const [ksManualOpen, setKsManualOpen] = useState(false);
  const [ksDriveOpen, setKsDriveOpen] = useState(false);
  const [ksName, setKsName] = useState('');
  const [ksType, setKsType] = useState('');
  const [ksPath, setKsPath] = useState('');
  const [ksFolderTag, setKsFolderTag] = useState('');
  const [ksProjectTag, setKsProjectTag] = useState('');
  const [ksRefreshing, setKsRefreshing] = useState<string | null>(null);
  const [ksUploadOpen, setKsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFolderTag, setUploadFolderTag] = useState('');
  const [uploadProjectTag, setUploadProjectTag] = useState('');
  const [uploadAgentId, setUploadAgentId] = useState('');
  const [uploadUploading, setUploadUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [driveIntegrations, setDriveIntegrations] = useState<Integration[]>([]);
  const [driveIntId, setDriveIntId] = useState('');
  const [driveFolderTag, setDriveFolderTag] = useState('');
  const [driveProjectTag, setDriveProjectTag] = useState('');
  const [driveAgentId, setDriveAgentId] = useState('');
  const [driveRoots, setDriveRoots] = useState<Array<{ id: string; name: string; kind: string }>>([]);
  const [drivePath, setDrivePath] = useState<Array<{ id: string; name: string }>>([]);
  const [driveFolders, setDriveFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; mimeType: string; modifiedTime: string; supported: boolean; isFolder: boolean }>>([]);
  const [driveSelectedIds, setDriveSelectedIds] = useState<Set<string>>(new Set());
  const [driveDiscovering, setDriveDiscovering] = useState(false);
  const [driveRegistering, setDriveRegistering] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveRootsLoaded, setDriveRootsLoaded] = useState(false);

  const loadKnowledgeSources = useCallback(async () => {
    setKsLoading(true);
    try {
      const data = await listKnowledgeSources();
      setKnowledgeSources(data);
    } catch { /* ignore */ } finally {
      setKsLoading(false);
    }
  }, []);

  useEffect(() => { loadKnowledgeSources(); }, [loadKnowledgeSources]);

  const loadDriveIntegrations = useCallback(async () => {
    try {
      const ints = await listIntegrationsByType('google_drive');
      setDriveIntegrations(ints);
      return ints;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    listAgents().then(setAllAgents).catch(() => {});
    loadDriveIntegrations();
  }, [loadDriveIntegrations]);

  // Auto-open Drive browser after returning from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      setTab(2);
      loadDriveIntegrations().then((ints) => {
        const connected = ints.find((i) => i.hasCredentials);
        if (connected) {
          setKsDriveOpen(true);
          setTimeout(() => handleDriveLoadRoots(connected.id), 100);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveManualKs = async () => {
    if (!ksName.trim() || !ksType.trim() || !ksPath.trim()) return;
    try {
      const newKs = await createKnowledgeSource({
          name: ksName, type: ksType, path: ksPath,
          sourceType: 'manual', externalId: null, integrationId: null,
          agentId: null, folderTag: ksFolderTag || null, projectTag: ksProjectTag || null,
          refreshIntervalMinutes: 60, mimeType: null,
        });
      setKnowledgeSources((prev) => [newKs, ...prev]);
    } catch { /* ignore */ }
    setKsManualOpen(false);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      if (uploadFolderTag) formData.append('folderTag', uploadFolderTag);
      if (uploadProjectTag) formData.append('projectTag', uploadProjectTag);
      if (uploadAgentId) formData.append('agentId', uploadAgentId);

      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Upload failed: ${res.status}`);
      }
      await loadKnowledgeSources();
      setKsUploadOpen(false);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploadUploading(false);
    }
  };

  const handleDeleteKs = async (id: string) => {
    try {
      await deleteKnowledgeSource(id);
      setKnowledgeSources((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  };

  const handleRefreshKs = async (id: string) => {
    setKsRefreshing(id);
    try {
      await refreshKnowledgeSource(id);
      await loadKnowledgeSources();
    } catch { /* ignore */ } finally {
      setKsRefreshing(null);
    }
  };

  const handleDriveCreateAndConnect = async () => {
    setDriveError(null);
    setDriveDiscovering(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'google_drive',
          config: { accessType: 'reader' },
          reason: 'Auto-created for knowledge source browsing',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to create integration');
      }
      const { integration } = await res.json();
      const newId = integration.id;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google OAuth Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env');
      }
      const redirectUri = `${window.location.origin}/api/integrations/google/callback`;
      const scope = 'https://www.googleapis.com/auth/drive.readonly';
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(newId)}`;
      window.location.href = url;
    } catch (err) {
      setDriveError((err as Error).message);
      setDriveDiscovering(false);
    }
  };

  const handleDriveLoadRoots = async (integrationId: string) => {
    setDriveIntId(integrationId);
    setDriveDiscovering(true);
    setDriveError(null);
    setDriveRootsLoaded(false);
    setDrivePath([]);
    setDriveFolders([]);
    setDriveFiles([]);
    setDriveSelectedIds(new Set());
    try {
      const roots = await discoverDriveRoots(integrationId);
      setDriveRoots(roots);
      setDriveRootsLoaded(true);
    } catch (err) {
      setDriveError((err as Error).message);
    } finally {
      setDriveDiscovering(false);
    }
  };

  const handleDriveNavigate = async (folderId: string, folderName: string, isRoot = false) => {
    setDriveDiscovering(true);
    setDriveError(null);
    setDriveFiles([]);
    setDriveFolders([]);
    setDriveSelectedIds(new Set());

    if (isRoot) {
      setDrivePath([{ id: folderId, name: folderName }]);
    } else {
      setDrivePath((prev) => [...prev, { id: folderId, name: folderName }]);
    }

    try {
      const { folders, files } = await discoverDriveContents(driveIntId, folderId);
      setDriveFolders(folders);
      setDriveFiles(files);
    } catch (err) {
      setDriveError((err as Error).message);
    } finally {
      setDriveDiscovering(false);
    }
  };

  const handleDriveBreadcrumb = async (index: number) => {
    const target = drivePath[index];
    setDrivePath((prev) => prev.slice(0, index + 1));
    setDriveDiscovering(true);
    setDriveError(null);
    setDriveFiles([]);
    setDriveFolders([]);
    setDriveSelectedIds(new Set());
    try {
      const { folders, files } = await discoverDriveContents(driveIntId, target.id);
      setDriveFolders(folders);
      setDriveFiles(files);
    } catch (err) {
      setDriveError((err as Error).message);
    } finally {
      setDriveDiscovering(false);
    }
  };

  const handleDriveBack = () => {
    if (drivePath.length <= 1) {
      setDrivePath([]);
      setDriveFolders([]);
      setDriveFiles([]);
      return;
    }
    const parentIndex = drivePath.length - 2;
    handleDriveBreadcrumb(parentIndex);
  };

  const handleDriveRegister = async () => {
    if (driveSelectedIds.size === 0) return;
    setDriveRegistering(true);
    try {
      for (const file of driveFiles.filter((f) => driveSelectedIds.has(f.id))) {
        await createKnowledgeSource({
          name: file.name,
          type: 'Document',
          path: file.id,
          sourceType: 'google_drive',
          externalId: file.id,
          integrationId: driveIntId,
          agentId: driveAgentId || null,
          folderTag: driveFolderTag || null,
          projectTag: driveProjectTag || null,
          refreshIntervalMinutes: 60,
          mimeType: file.mimeType,
        });
      }
      await loadKnowledgeSources();
      setKsDriveOpen(false);
    } catch { /* ignore */ } finally {
      setDriveRegistering(false);
    }
  };

  const toggleDriveFile = (fileId: string) => {
    setDriveSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  // ===== Users state =====
  const [usersLoading, setUsersLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    listProfiles()
      .then((data) => { setUsers(data); setUsersLoading(false); })
      .catch(() => setUsersLoading(false));
  }, []);

  const canManageUsers = can(currentUser?.role, 'manage_users');

  const handleRoleChange = async (userId: string, newRole: UserRoleValue) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      if (!res.ok) return;
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch { /* ignore */ }
  };

  const allRoles: UserRoleValue[] = [
    UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEAM_LEAD, UserRole.CONTRIBUTOR, UserRole.VIEWER,
  ];

  return (
    <PageContainer>
      <Header title="Admin" subtitle="Audit logs, usage, knowledge sources, and user management" />

      {process.env.NODE_ENV !== 'production' && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>Dev Seed</Typography>
              <Typography variant="caption" color="text.secondary">
                Populate persona overrides, tasks, conversations, and audit logs from agent persona docs.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSeed}
              disabled={seedLoading}
              startIcon={seedLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {seedLoading ? 'Seeding...' : 'Seed Dev Data'}
            </Button>
          </Box>
          {seedResult && (
            <Alert severity="success" sx={{ mt: 1.5 }}>
              {seedResult.join(' · ')}
            </Alert>
          )}
          {seedError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {seedError}
            </Alert>
          )}
        </Card>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Audit Log" />
          <Tab label="Usage" />
          <Tab label="Knowledge Sources" />
          <Tab label="Users" />
        </Tabs>
      </Box>

      {/* ===== Audit Log Tab ===== */}
      {tab === 0 && (
        <SectionContainer>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Actor</InputLabel>
              <Select value={auditFilterActor} label="Actor" onChange={(e) => setAuditFilterActor(e.target.value)}>
                <MenuItem value="all">All Actors</MenuItem>
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Action Type</InputLabel>
              <Select value={auditFilterAction} label="Action Type" onChange={(e) => setAuditFilterAction(e.target.value)}>
                <MenuItem value="all">All Actions</MenuItem>
                {allActionTypes.map((a) => (
                  <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Entity</InputLabel>
              <Select value={auditFilterEntity} label="Entity" onChange={(e) => setAuditFilterEntity(e.target.value)}>
                <MenuItem value="all">All Entities</MenuItem>
                {allEntityTypes.map((e) => (
                  <MenuItem key={e} value={e}>{e}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
              {auditLogs.length} entr{auditLogs.length !== 1 ? 'ies' : 'y'}
            </Typography>
          </Box>

          {auditLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : auditError ? (
            <Alert severity="error">{auditError}</Alert>
          ) : (
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No audit log entries{auditFilterActor !== 'all' || auditFilterAction !== 'all' || auditFilterEntity !== 'all' ? ' matching filters' : ' yet'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell><Typography variant="caption">{new Date(entry.timestamp).toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{entry.actorName}</Typography></TableCell>
                        <TableCell>
                          <Chip label={entry.actionType.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{entry.entityType}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionContainer>
      )}

      {/* ===== Usage Tab ===== */}
      {tab === 1 && (
        <SectionContainer>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <UsageStatBlock label="Total Tokens" value="0" sublabel="No runtime connected" icon={<TokenIcon />} />
            <UsageStatBlock label="Total Cost" value="$0.00" sublabel="No runtime connected" icon={<MoneyOffIcon />} />
            <UsageStatBlock label="Active Agents" value={0} sublabel="No runtime connected" icon={<SmartToyIcon />} />
          </Box>
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Detailed usage metrics will be populated when agents are connected to a runtime.
            </Typography>
          </Card>
        </SectionContainer>
      )}

      {/* ===== Knowledge Sources Tab ===== */}
      {tab === 2 && (
        <SectionContainer
          title="Knowledge Sources"
          actions={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<UploadFileIcon />} onClick={() => { setUploadFile(null); setUploadName(''); setUploadFolderTag(''); setUploadProjectTag(''); setUploadAgentId(''); setUploadError(null); setKsUploadOpen(true); }}>
                Upload
              </Button>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => { setKsName(''); setKsType(''); setKsPath(''); setKsFolderTag(''); setKsProjectTag(''); setKsManualOpen(true); }}>
                Add Manual
              </Button>
              <Button
                variant="contained" size="small" startIcon={<CloudIcon />}
                onClick={() => { setDriveFiles([]); setDriveFolders([]); setDriveRoots([]); setDriveRootsLoaded(false); setDrivePath([]); setDriveSelectedIds(new Set()); setDriveError(null); setDriveFolderTag(''); setDriveProjectTag(''); setDriveAgentId(''); setDriveIntId(''); setKsDriveOpen(true); }}
              >
                Add from Google Drive
              </Button>
            </Box>
          }
        >
          {ksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Folder Tag</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Verified</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {knowledgeSources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No knowledge sources configured</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    knowledgeSources.map((source) => (
                      <TableRow key={source.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {source.sourceType === 'google_drive' ? <CloudIcon fontSize="small" sx={{ color: 'text.disabled' }} /> : source.sourceType === 'upload' ? <UploadFileIcon fontSize="small" sx={{ color: 'text.disabled' }} /> : <DescriptionIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
                            <Typography variant="body2">{source.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={source.sourceType === 'google_drive' ? 'Google Drive' : source.sourceType === 'upload' ? 'Upload' : 'Manual'} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell>
                          {source.folderTag ? (
                            <Chip label={source.folderTag} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {source.projectTag ? (
                            <Chip label={source.projectTag} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{source.agentName ?? 'All'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {source.fetchStatus === 'fresh' && <><CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} /><Typography variant="caption">Fresh</Typography></>}
                            {source.fetchStatus === 'stale' && <><WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} /><Typography variant="caption">Stale</Typography></>}
                            {source.fetchStatus === 'error' && <><ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} /><Typography variant="caption">Error</Typography></>}
                            {source.fetchStatus === 'never_fetched' && <><HelpIcon sx={{ fontSize: 16, color: 'text.disabled' }} /><Typography variant="caption">Not fetched</Typography></>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.disabled">
                            {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleString() : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            {source.sourceType === 'google_drive' && (
                              <IconButton
                                size="small"
                                onClick={() => handleRefreshKs(source.id)}
                                disabled={ksRefreshing === source.id}
                              >
                                {ksRefreshing === source.id ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                              </IconButton>
                            )}
                            <IconButton size="small" onClick={() => handleDeleteKs(source.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Alert removed — the Drive dialog now handles the "no integration" case inline */}

          {/* Add Manual Dialog */}
          <Dialog open={ksManualOpen} onClose={() => setKsManualOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Manual Knowledge Source</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField label="Name" value={ksName} onChange={(e) => setKsName(e.target.value)} required fullWidth />
                <TextField label="Type" value={ksType} onChange={(e) => setKsType(e.target.value)} required fullWidth placeholder="SOW, PRD, Architecture, QA, Ops" />
                <TextField label="Path" value={ksPath} onChange={(e) => setKsPath(e.target.value)} required fullWidth placeholder="brain/sow/project.md" />
                <TextField label="Folder Tag" value={ksFolderTag} onChange={(e) => setKsFolderTag(e.target.value)} fullWidth placeholder="architecture, sow, qa, prd, ops" helperText="Maps to agent knowledge scope allowed folders" />
                <TextField label="Project" value={ksProjectTag} onChange={(e) => setKsProjectTag(e.target.value)} fullWidth placeholder="fullstackrx, fullthrottle" helperText="Maps to agent knowledge scope allowed projects" />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setKsManualOpen(false)} variant="outlined" color="inherit">Cancel</Button>
              <Button onClick={handleSaveManualKs} variant="contained" disabled={!ksName.trim() || !ksType.trim() || !ksPath.trim()}>Add</Button>
            </DialogActions>
          </Dialog>

          {/* Add from Google Drive Dialog */}
          <Dialog open={ksDriveOpen} onClose={() => setKsDriveOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Browse Google Drive</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                {/* Integration selector or connect button */}
                {driveIntegrations.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
                    <CloudIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No Google Drive connection found. Connect your Google account to browse Drive folders.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={driveDiscovering ? <CircularProgress size={16} color="inherit" /> : <CloudIcon />}
                      onClick={handleDriveCreateAndConnect}
                      disabled={driveDiscovering}
                    >
                      Connect Google Drive
                    </Button>
                    {driveError && <Alert severity="error" sx={{ width: '100%' }}>{driveError}</Alert>}
                  </Box>
                ) : (
                  <FormControl fullWidth size="small">
                    <InputLabel>Google Drive Integration</InputLabel>
                    <Select
                      value={driveIntId}
                      label="Google Drive Integration"
                      onChange={(e) => handleDriveLoadRoots(e.target.value)}
                    >
                      {driveIntegrations.map((int) => (
                        <MenuItem key={int.id} value={int.id}>
                          {int.agentName ? `${int.agentName} — Google Drive` : `Google Drive (${int.id.slice(0, 8)})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Folder tag + agent assignment */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField label="Folder Tag" value={driveFolderTag} onChange={(e) => setDriveFolderTag(e.target.value)} size="small" placeholder="architecture, sow, qa" helperText="Applied to all selected files" />
                  <TextField label="Project" value={driveProjectTag} onChange={(e) => setDriveProjectTag(e.target.value)} size="small" placeholder="fullstackrx, fullthrottle" helperText="Project scoping" />
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Assign to Agent</InputLabel>
                    <Select value={driveAgentId} label="Assign to Agent" onChange={(e) => setDriveAgentId(e.target.value)}>
                      <MenuItem value="">All Agents</MenuItem>
                      {allAgents.map((a) => (
                        <MenuItem key={a.id} value={a.id}>{a.name} ({a.role})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {driveError && <Alert severity="error">{driveError}</Alert>}

                {/* Drive roots (initial view) */}
                {driveRootsLoaded && drivePath.length === 0 && (
                  <Card variant="outlined">
                    <List disablePadding>
                      {driveRoots.map((root, idx) => (
                        <Box key={root.id}>
                          <ListItemButton
                            onClick={() => handleDriveNavigate(root.id, root.name, true)}
                            sx={{ py: 1.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {root.kind === 'shared_drive' ? <StorageIcon fontSize="small" /> : <FolderOpenIcon fontSize="small" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={<Typography variant="body2" fontWeight={500}>{root.name}</Typography>}
                              secondary={<Typography variant="caption" color="text.disabled">{root.kind === 'shared_drive' ? 'Shared Drive' : 'Personal Drive'}</Typography>}
                            />
                          </ListItemButton>
                          {idx < driveRoots.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  </Card>
                )}

                {/* Folder browser (after navigating into a drive/folder) */}
                {drivePath.length > 0 && (
                  <>
                    {/* Breadcrumb navigation */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" onClick={handleDriveBack}>
                        <ArrowBackIcon fontSize="small" />
                      </IconButton>
                      <Breadcrumbs sx={{ fontSize: '0.8rem' }}>
                        {drivePath.map((crumb, idx) => (
                          idx < drivePath.length - 1 ? (
                            <Link
                              key={crumb.id}
                              component="button"
                              variant="caption"
                              onClick={() => handleDriveBreadcrumb(idx)}
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

                    {driveDiscovering ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Card variant="outlined" sx={{ maxHeight: 380, overflow: 'auto' }}>
                        {/* Subfolders */}
                        {driveFolders.length > 0 && (
                          <List disablePadding>
                            {driveFolders.map((folder) => (
                              <ListItemButton
                                key={folder.id}
                                onClick={() => handleDriveNavigate(folder.id, folder.name)}
                                sx={{ py: 1 }}
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <FolderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                </ListItemIcon>
                                <ListItemText primary={<Typography variant="body2">{folder.name}</Typography>} />
                              </ListItemButton>
                            ))}
                            {driveFiles.length > 0 && <Divider />}
                          </List>
                        )}

                        {/* Files (selectable) */}
                        {driveFiles.length > 0 && (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={driveFiles.filter((f) => f.supported).length > 0 && driveFiles.filter((f) => f.supported).every((f) => driveSelectedIds.has(f.id))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setDriveSelectedIds(new Set(driveFiles.filter((f) => f.supported).map((f) => f.id)));
                                      } else {
                                        setDriveSelectedIds(new Set());
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
                              {driveFiles.map((file) => (
                                <TableRow key={file.id} hover sx={{ opacity: file.supported ? 1 : 0.5 }}>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      checked={driveSelectedIds.has(file.id)}
                                      onChange={() => toggleDriveFile(file.id)}
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

                        {driveFolders.length === 0 && driveFiles.length === 0 && !driveDiscovering && (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">This folder is empty</Typography>
                          </Box>
                        )}
                      </Card>
                    )}
                  </>
                )}

                {/* Loading state for initial roots */}
                {driveDiscovering && !driveRootsLoaded && drivePath.length === 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setKsDriveOpen(false)} variant="outlined" color="inherit">Cancel</Button>
              <Button
                onClick={handleDriveRegister}
                variant="contained"
                disabled={driveSelectedIds.size === 0 || driveRegistering}
                startIcon={driveRegistering ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                Register {driveSelectedIds.size > 0 ? `${driveSelectedIds.size} File${driveSelectedIds.size > 1 ? 's' : ''}` : 'Selected'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Upload Document Dialog */}
          <Dialog open={ksUploadOpen} onClose={() => setKsUploadOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  {uploadFile ? uploadFile.name : 'Choose a file (.txt, .md, .csv, .json, .yaml, .pdf)'}
                  <input
                    type="file"
                    hidden
                    accept=".txt,.md,.csv,.json,.yaml,.yml,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setUploadFile(f);
                        if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, ''));
                      }
                    }}
                  />
                </Button>

                <TextField
                  label="Name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  fullWidth
                  placeholder="Document name (auto-filled from file)"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Folder Tag" value={uploadFolderTag} onChange={(e) => setUploadFolderTag(e.target.value)} size="small" fullWidth placeholder="architecture, sow, qa" />
                  <TextField label="Project" value={uploadProjectTag} onChange={(e) => setUploadProjectTag(e.target.value)} size="small" fullWidth placeholder="fullstackrx, fullthrottle" />
                </Box>

                <FormControl size="small" fullWidth>
                  <InputLabel>Assign to Agent</InputLabel>
                  <Select value={uploadAgentId} label="Assign to Agent" onChange={(e) => setUploadAgentId(e.target.value)}>
                    <MenuItem value="">All Agents</MenuItem>
                    {allAgents.map((a) => (
                      <MenuItem key={a.id} value={a.id}>{a.name} ({a.role})</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {uploadError && <Alert severity="error">{uploadError}</Alert>}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setKsUploadOpen(false)} variant="outlined" color="inherit">Cancel</Button>
              <Button
                onClick={handleUpload}
                variant="contained"
                disabled={!uploadFile || uploadUploading}
                startIcon={uploadUploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
              >
                {uploadUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogActions>
          </Dialog>
        </SectionContainer>
      )}

      {/* ===== Users Tab ===== */}
      {tab === 3 && (
        <SectionContainer>
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No users found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell><Typography variant="body2">{u.name}</Typography></TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{u.email}</Typography></TableCell>
                        <TableCell>
                          {canManageUsers && u.id !== currentUser?.id ? (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRoleValue)}
                                sx={{ height: 28, fontSize: '0.75rem' }}
                              >
                                {allRoles.map((r) => (
                                  <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip label={ROLE_LABELS[u.role]} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.disabled">{new Date(u.createdAt).toLocaleDateString()}</Typography></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionContainer>
      )}
    </PageContainer>
  );
}
