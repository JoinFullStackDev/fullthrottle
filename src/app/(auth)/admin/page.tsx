'use client';

import { useState, useMemo } from 'react';
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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import TokenIcon from '@mui/icons-material/TokenOutlined';
import MoneyOffIcon from '@mui/icons-material/MoneyOffOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import UsageStatBlock from '@/features/usage/components/UsageStatBlock';
import { MOCK_AUDIT_LOG } from '@/features/audit/mock-data';
import { MOCK_KNOWLEDGE_SOURCES } from '@/features/knowledge/mock-data';
import { MOCK_USERS } from '@/features/usage/mock-data';
import { MOCK_AGENTS } from '@/features/agents/mock-data';
import { ROLE_LABELS } from '@/lib/constants';
import type { KnowledgeSource } from '@/lib/types';

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  // --- Audit Log filters ---
  const [auditFilterActor, setAuditFilterActor] = useState('all');
  const [auditFilterAction, setAuditFilterAction] = useState('all');
  const [auditFilterEntity, setAuditFilterEntity] = useState('all');

  const actionTypes = useMemo(
    () => Array.from(new Set(MOCK_AUDIT_LOG.map((e) => e.actionType))).sort(),
    []
  );
  const entityTypes = useMemo(
    () => Array.from(new Set(MOCK_AUDIT_LOG.map((e) => e.entityType))).sort(),
    []
  );

  const filteredAuditLog = useMemo(() => {
    let entries = [...MOCK_AUDIT_LOG];
    if (auditFilterActor !== 'all') {
      entries = entries.filter((e) => e.actorId === auditFilterActor);
    }
    if (auditFilterAction !== 'all') {
      entries = entries.filter((e) => e.actionType === auditFilterAction);
    }
    if (auditFilterEntity !== 'all') {
      entries = entries.filter((e) => e.entityType === auditFilterEntity);
    }
    return entries;
  }, [auditFilterActor, auditFilterAction, auditFilterEntity]);

  // --- Knowledge Sources local state ---
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([...MOCK_KNOWLEDGE_SOURCES]);
  const [ksDialogOpen, setKsDialogOpen] = useState(false);
  const [editingKs, setEditingKs] = useState<KnowledgeSource | null>(null);
  const [ksName, setKsName] = useState('');
  const [ksType, setKsType] = useState('');
  const [ksPath, setKsPath] = useState('');

  const openAddKs = () => {
    setEditingKs(null);
    setKsName('');
    setKsType('');
    setKsPath('');
    setKsDialogOpen(true);
  };

  const openEditKs = (source: KnowledgeSource) => {
    setEditingKs(source);
    setKsName(source.name);
    setKsType(source.type);
    setKsPath(source.path);
    setKsDialogOpen(true);
  };

  const handleSaveKs = () => {
    if (!ksName.trim() || !ksType.trim() || !ksPath.trim()) return;
    if (editingKs) {
      setKnowledgeSources((prev) =>
        prev.map((s) =>
          s.id === editingKs.id ? { ...s, name: ksName, type: ksType, path: ksPath } : s
        )
      );
    } else {
      setKnowledgeSources((prev) => [
        {
          id: `ks-${Date.now()}`,
          name: ksName,
          type: ksType,
          path: ksPath,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setKsDialogOpen(false);
  };

  return (
    <PageContainer>
      <Header title="Admin" subtitle="Audit logs, usage, knowledge sources, and user management" />

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
              <Select
                value={auditFilterActor}
                label="Actor"
                onChange={(e) => setAuditFilterActor(e.target.value)}
              >
                <MenuItem value="all">All Actors</MenuItem>
                {MOCK_USERS.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Action Type</InputLabel>
              <Select
                value={auditFilterAction}
                label="Action Type"
                onChange={(e) => setAuditFilterAction(e.target.value)}
              >
                <MenuItem value="all">All Actions</MenuItem>
                {actionTypes.map((a) => (
                  <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Entity</InputLabel>
              <Select
                value={auditFilterEntity}
                label="Entity"
                onChange={(e) => setAuditFilterEntity(e.target.value)}
              >
                <MenuItem value="all">All Entities</MenuItem>
                {entityTypes.map((e) => (
                  <MenuItem key={e} value={e}>{e}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
              {filteredAuditLog.length} entr{filteredAuditLog.length !== 1 ? 'ies' : 'y'}
            </Typography>
          </Box>
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
                {filteredAuditLog.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.actorName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.actionType.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {entry.entityType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          maxWidth: 300,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.reason}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionContainer>
      )}

      {/* ===== Usage Tab ===== */}
      {tab === 1 && (
        <SectionContainer>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <UsageStatBlock
              label="Total Tokens"
              value="0"
              sublabel="No runtime connected"
              icon={<TokenIcon />}
            />
            <UsageStatBlock
              label="Total Cost"
              value="$0.00"
              sublabel="No runtime connected"
              icon={<MoneyOffIcon />}
            />
            <UsageStatBlock
              label="Active Agents"
              value={MOCK_AGENTS.filter((a) => a.status === 'active').length}
              sublabel={`${MOCK_AGENTS.length} registered`}
              icon={<SmartToyIcon />}
            />
          </Box>
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Detailed usage metrics will be populated when agents are connected to a runtime.
              Token counts, cost estimates, and per-model breakdowns will appear here.
            </Typography>
          </Card>
        </SectionContainer>
      )}

      {/* ===== Knowledge Sources Tab ===== */}
      {tab === 2 && (
        <SectionContainer
          title="Knowledge Sources"
          actions={
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAddKs}>
              Add Source
            </Button>
          }
        >
          <Card>
            <List disablePadding>
              {knowledgeSources.map((source, idx) => (
                <Box key={source.id}>
                  <ListItemButton sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <DescriptionIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {source.name}
                          </Typography>
                          <Chip
                            label={source.type}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.disabled">
                          {source.path}
                        </Typography>
                      }
                    />
                    <IconButton size="small" onClick={() => openEditKs(source)} sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </Typography>
                  </ListItemButton>
                  {idx < knowledgeSources.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Card>

          <Dialog open={ksDialogOpen} onClose={() => setKsDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{editingKs ? 'Edit Knowledge Source' : 'Add Knowledge Source'}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                  label="Name"
                  value={ksName}
                  onChange={(e) => setKsName(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Type"
                  value={ksType}
                  onChange={(e) => setKsType(e.target.value)}
                  required
                  fullWidth
                  placeholder="SOW, PRD, Architecture, QA, Ops, etc."
                />
                <TextField
                  label="Path"
                  value={ksPath}
                  onChange={(e) => setKsPath(e.target.value)}
                  required
                  fullWidth
                  placeholder="brain/sow/project.md"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setKsDialogOpen(false)} variant="outlined" color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handleSaveKs}
                variant="contained"
                disabled={!ksName.trim() || !ksType.trim() || !ksPath.trim()}
              >
                {editingKs ? 'Save' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>
        </SectionContainer>
      )}

      {/* ===== Users Tab ===== */}
      {tab === 3 && (
        <SectionContainer>
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
                {MOCK_USERS.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2">{user.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[user.role]}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionContainer>
      )}
    </PageContainer>
  );
}
