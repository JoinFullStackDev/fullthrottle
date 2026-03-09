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
import TokenIcon from '@mui/icons-material/TokenOutlined';
import MoneyOffIcon from '@mui/icons-material/MoneyOffOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/RefreshOutlined';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAddOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import ArchiveIcon from '@mui/icons-material/ArchiveOutlined';
import UnarchiveIcon from '@mui/icons-material/UnarchiveOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import { listProjects, listActiveProjects, createProject, updateProject } from '@/features/projects/service';
import type { Project } from '@/lib/types';
import UsageStatBlock from '@/features/usage/components/UsageStatBlock';
import { listAuditLogs } from '@/features/audit/service';
import {
  listKnowledgeSources,
  createKnowledgeSource,
  deleteKnowledgeSource,
  refreshKnowledgeSource,
} from '@/features/knowledge/service';
import { KnowledgeSourceTable, UploadDialog, DriveBrowserDialog } from '@/features/knowledge/components';
import { listProfiles } from '@/lib/services/profiles';
import { listAgents } from '@/features/agents/service';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/permissions';
import { ROLE_LABELS, UserRole } from '@/lib/constants';
import type { UserRoleValue } from '@/lib/constants';
import type { AuditLogEntry, KnowledgeSource, User, Agent } from '@/lib/types';

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const { user: currentUser } = useAuth();

  // ===== Projects =====
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectSaving, setProjectSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 4) loadProjects();
  }, [tab, loadProjects]);

  useEffect(() => {
    listActiveProjects().then(setActiveProjects).catch(() => {});
  }, []);

  const handleProjectDialogOpen = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
      setProjectSlug(project.slug);
      setProjectDescription(project.description);
    } else {
      setEditingProject(null);
      setProjectName('');
      setProjectSlug('');
      setProjectDescription('');
    }
    setProjectDialogOpen(true);
  };

  const handleProjectDialogClose = () => {
    setProjectDialogOpen(false);
    setEditingProject(null);
    setProjectName('');
    setProjectSlug('');
    setProjectDescription('');
  };

  const handleProjectSave = async () => {
    setProjectSaving(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: projectName.trim(),
          description: projectDescription.trim(),
        });
      } else {
        await createProject({
          name: projectName.trim(),
          slug: projectSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: projectDescription.trim(),
        });
      }
      handleProjectDialogClose();
      loadProjects();
    } catch {
      // silent
    } finally {
      setProjectSaving(false);
    }
  };

  const handleProjectArchiveToggle = async (project: Project) => {
    try {
      await updateProject(project.id, {
        status: project.status === 'active' ? 'archived' : 'active',
      });
      loadProjects();
    } catch {
      // silent
    }
  };

  const autoSlug = (name: string) => {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

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
  const [allAgents, setAllAgents] = useState<Agent[]>([]);

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

  useEffect(() => {
    listAgents().then(setAllAgents).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      setTab(2);
      setKsDriveOpen(true);
    }
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

  // ===== Invite state =====
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRoleValue>(UserRole.VIEWER);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Invite failed');
        setInviteLoading(false);
        return;
      }
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole(UserRole.VIEWER);
      listProfiles()
        .then((profiles) => setUsers(profiles))
        .catch(() => {});
    } catch (err) {
      setInviteError((err as Error).message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteClose = () => {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole(UserRole.VIEWER);
    setInviteError(null);
    setInviteSuccess(null);
  };

  // ===== Delete user state =====
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setInviteError(data.error || 'Delete failed');
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      }
    } catch { /* ignore */ } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

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
          <Tab label="Projects" />
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
              <Button variant="outlined" size="small" startIcon={<UploadFileIcon />} onClick={() => setKsUploadOpen(true)}>
                Upload
              </Button>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => { setKsName(''); setKsType(''); setKsPath(''); setKsFolderTag(''); setKsProjectTag(''); setKsManualOpen(true); }}>
                Add Manual
              </Button>
              <Button variant="contained" size="small" startIcon={<CloudIcon />} onClick={() => setKsDriveOpen(true)}>
                Add from Google Drive
              </Button>
            </Box>
          }
        >
          <KnowledgeSourceTable
            sources={knowledgeSources}
            loading={ksLoading}
            refreshingId={ksRefreshing}
            onRefresh={handleRefreshKs}
            onDelete={handleDeleteKs}
          />

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

          <UploadDialog
            open={ksUploadOpen}
            onClose={() => setKsUploadOpen(false)}
            onUploadComplete={loadKnowledgeSources}
            projects={activeProjects}
            agents={allAgents}
          />

          <DriveBrowserDialog
            open={ksDriveOpen}
            onClose={() => setKsDriveOpen(false)}
            onRegisterComplete={loadKnowledgeSources}
            projects={activeProjects}
            agents={allAgents}
          />
        </SectionContainer>
      )}

      {/* ===== Users Tab ===== */}
      {tab === 3 && (
        <SectionContainer>
          {canManageUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteOpen(true)}
              >
                Invite User
              </Button>
            </Box>
          )}

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
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    {canManageUsers && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManageUsers ? 6 : 5} align="center">
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
                        <TableCell>
                          {u.invitedAt && !u.onboardedAt ? (
                            <Chip label="Pending" size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="Active" size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.disabled">{new Date(u.createdAt).toLocaleDateString()}</Typography></TableCell>
                        {canManageUsers && (
                          <TableCell align="right">
                            {u.id !== currentUser?.id && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget(u)}
                                aria-label={`Delete ${u.name}`}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Delete User Confirmation */}
          <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth="xs" fullWidth>
            <DialogTitle>Delete User</DialogTitle>
            <DialogContent>
              <Typography variant="body2">
                Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? This cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDeleteTarget(null)} variant="outlined" color="inherit" disabled={deleteLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                variant="contained"
                color="error"
                disabled={deleteLoading}
                startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Invite User Dialog */}
          <Dialog open={inviteOpen} onClose={handleInviteClose} maxWidth="xs" fullWidth>
            <DialogTitle>Invite User</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              {inviteError && <Alert severity="error" sx={{ mt: 1 }}>{inviteError}</Alert>}
              {inviteSuccess && <Alert severity="success" sx={{ mt: 1 }}>{inviteSuccess}</Alert>}
              <TextField
                label="Email Address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                fullWidth
                required
                disabled={inviteLoading}
                autoFocus
                sx={{ mt: 1 }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={inviteRole}
                  label="Role"
                  onChange={(e) => setInviteRole(e.target.value as UserRoleValue)}
                  disabled={inviteLoading}
                >
                  {allRoles.map((r) => (
                    <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleInviteClose} variant="outlined" color="inherit" disabled={inviteLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                variant="contained"
                disabled={inviteLoading || !inviteEmail.trim()}
                startIcon={inviteLoading ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogActions>
          </Dialog>
        </SectionContainer>
      )}

      {/* ===== Projects Tab ===== */}
      {tab === 4 && (
        <SectionContainer
          title="Projects"
          actions={
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleProjectDialogOpen()}
            >
              Add Project
            </Button>
          }
        >
          {projectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects
                    .sort((a, b) => {
                      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((project) => (
                      <TableRow
                        key={project.id}
                        sx={project.status === 'archived' ? { opacity: 0.5 } : {}}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {project.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.slug}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {project.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                              ...(project.status === 'archived'
                                ? { borderColor: 'text.disabled', color: 'text.disabled' }
                                : { borderColor: 'success.main', color: 'success.main' }),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleProjectDialogOpen(project)}
                            title="Edit"
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleProjectArchiveToggle(project)}
                            title={project.status === 'active' ? 'Archive' : 'Unarchive'}
                          >
                            {project.status === 'active' ? (
                              <ArchiveIcon sx={{ fontSize: 18 }} />
                            ) : (
                              <UnarchiveIcon sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Dialog open={projectDialogOpen} onClose={handleProjectDialogClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                  label="Project Name"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (!editingProject) setProjectSlug(autoSlug(e.target.value));
                  }}
                  fullWidth
                  required
                />
                {!editingProject && (
                  <TextField
                    label="Slug"
                    value={projectSlug}
                    onChange={(e) => setProjectSlug(e.target.value)}
                    fullWidth
                    required
                    helperText="Lowercase identifier used in task tags and API calls"
                    slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
                  />
                )}
                <TextField
                  label="Description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleProjectDialogClose} variant="outlined" color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handleProjectSave}
                variant="contained"
                disabled={projectSaving || !projectName.trim() || (!editingProject && !projectSlug.trim())}
              >
                {projectSaving ? <CircularProgress size={20} /> : editingProject ? 'Save' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
        </SectionContainer>
      )}
    </PageContainer>
  );
}
