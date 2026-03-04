'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ChatIcon from '@mui/icons-material/ChatOutlined';
import CodeIcon from '@mui/icons-material/CodeOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import IntegrationConfigDialog from '@/features/integrations/components/IntegrationConfigDialog';
import { listIntegrations } from '@/features/integrations/service';
import { listAgents } from '@/features/agents/service';
import {
  IntegrationType,
  INTEGRATION_LABELS,
  INTEGRATION_STATUS_LABELS,
  IntegrationStatus,
} from '@/lib/constants';
import type { IntegrationTypeValue } from '@/lib/constants';
import type { Integration, Agent } from '@/lib/types';

const INTEGRATION_TYPES: { type: IntegrationTypeValue; icon: React.ReactNode; description: string }[] = [
  { type: IntegrationType.SLACK, icon: <ChatIcon sx={{ fontSize: 32 }} />, description: 'Bot accounts, channel routing, and message dispatch' },
  { type: IntegrationType.GITLAB, icon: <CodeIcon sx={{ fontSize: 32 }} />, description: 'Repository access, MR workflows, and CI/CD triggers' },
  { type: IntegrationType.GOOGLE_DRIVE, icon: <FolderIcon sx={{ fontSize: 32 }} />, description: 'Knowledge workspace access and document retrieval' },
];

function statusColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  switch (status) {
    case IntegrationStatus.CONNECTED: return 'success';
    case IntegrationStatus.CONFIGURED: return 'warning';
    case IntegrationStatus.ERROR: return 'error';
    default: return 'default';
  }
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<IntegrationTypeValue>(IntegrationType.SLACK);
  const [dialogAgentId, setDialogAgentId] = useState('');
  const [dialogAgentName, setDialogAgentName] = useState('');
  const [dialogExisting, setDialogExisting] = useState<Integration | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [intData, agentData] = await Promise.all([
        listIntegrations(),
        listAgents(),
      ]);
      setIntegrations(intData);
      setAgents(agentData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedType = INTEGRATION_TYPES[selectedTab];

  const getAgentIntegration = (agentId: string, type: IntegrationTypeValue): Integration | undefined =>
    integrations.find((i) => i.agentId === agentId && i.type === type);

  const countConfigured = (type: IntegrationTypeValue) =>
    integrations.filter((i) => i.type === type && i.status !== IntegrationStatus.NOT_CONFIGURED).length;

  const openDialog = (type: IntegrationTypeValue, agent: Agent, existing?: Integration) => {
    setDialogType(type);
    setDialogAgentId(agent.id);
    setDialogAgentName(agent.name);
    setDialogExisting(existing ?? null);
    setDialogOpen(true);
  };

  return (
    <PageContainer>
      <Header title="Integrations" subtitle="Manage external service connections for agents" />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            {INTEGRATION_TYPES.map((it, idx) => {
              const configured = countConfigured(it.type);
              const isActive = selectedTab === idx;
              return (
                <Card
                  key={it.type}
                  sx={{
                    cursor: 'pointer',
                    border: 2,
                    borderColor: isActive ? 'primary.main' : 'transparent',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: isActive ? 'primary.main' : 'divider' },
                  }}
                  onClick={() => setSelectedTab(idx)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: isActive ? 'primary.main' : 'text.secondary', mb: 1 }}>
                      {it.icon}
                    </Box>
                    <Typography variant="h3" sx={{ mb: 0.5 }}>
                      {INTEGRATION_LABELS[it.type]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      {it.description}
                    </Typography>
                    <Chip
                      label={`${configured}/${agents.length} agents configured`}
                      size="small"
                      variant="outlined"
                      color={configured > 0 ? 'success' : 'default'}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
              {INTEGRATION_TYPES.map((it) => (
                <Tab key={it.type} label={INTEGRATION_LABELS[it.type]} />
              ))}
            </Tabs>
          </Box>

          <SectionContainer title={`${INTEGRATION_LABELS[selectedType.type]} — Agent Configuration`}>
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Credentials</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((agent) => {
                    const integration = getAgentIntegration(agent.id, selectedType.type);
                    const config = (integration?.config ?? {}) as Record<string, unknown>;
                    const email = (config.agentEmail as string) || '';
                    const status = integration?.status ?? IntegrationStatus.NOT_CONFIGURED;

                    return (
                      <TableRow key={agent.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{agent.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{agent.role}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={email ? 'text.primary' : 'text.disabled'}>
                            {email || 'Not set'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={INTEGRATION_STATUS_LABELS[status]}
                            size="small"
                            variant="outlined"
                            color={statusColor(status)}
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color={integration?.hasCredentials ? 'success.main' : 'text.disabled'}>
                            {integration?.hasCredentials ? 'Stored' : 'None'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.disabled">
                            {integration ? new Date(integration.updatedAt).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openDialog(selectedType.type, agent, integration)}
                          >
                            {integration ? 'Edit' : 'Setup'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {agents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No agents registered
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionContainer>

          <IntegrationConfigDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onSaved={loadData}
            type={dialogType}
            agentId={dialogAgentId}
            agentName={dialogAgentName}
            existing={dialogExisting}
          />
        </>
      )}
    </PageContainer>
  );
}
