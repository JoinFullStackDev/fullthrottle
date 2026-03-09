'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CodeIcon from '@mui/icons-material/CodeOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import LinkIcon from '@mui/icons-material/LinkOutlined';
import { PageContainer, Header } from '@/components/layout';
import IntegrationConfigDialog from '@/features/integrations/components/IntegrationConfigDialog';
import { listIntegrations } from '@/features/integrations/service';
import {
  IntegrationType,
  INTEGRATION_LABELS,
  INTEGRATION_STATUS_LABELS,
  IntegrationStatus,
} from '@/lib/constants';
import type { IntegrationTypeValue } from '@/lib/constants';
import type { Integration } from '@/lib/types';

function statusChipProps(status: string) {
  switch (status) {
    case IntegrationStatus.CONNECTED:
      return { color: 'success' as const, icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
    case IntegrationStatus.CONFIGURED:
      return { color: 'warning' as const, icon: <SettingsIcon sx={{ fontSize: 16 }} /> };
    case IntegrationStatus.ERROR:
      return { color: 'error' as const, icon: <ErrorIcon sx={{ fontSize: 16 }} /> };
    default:
      return { color: 'default' as const, icon: <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} /> };
  }
}

function findSystemIntegration(integrations: Integration[], type: IntegrationTypeValue) {
  return integrations.find((i) => i.type === type && !i.agentId) ?? null;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogExisting, setDialogExisting] = useState<Integration | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listIntegrations();
      setIntegrations(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      setSuccessMessage('Google Drive connected successfully. Browse files from the Knowledge workspace.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    const googleError = params.get('google_error');
    if (googleError) {
      setError(`Google Drive connection failed: ${googleError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const gitlabInt = findSystemIntegration(integrations, IntegrationType.GITLAB);
  const driveInt = findSystemIntegration(integrations, IntegrationType.GOOGLE_DRIVE);

  const gitlabConfig = (gitlabInt?.config ?? {}) as Record<string, unknown>;
  const gitlabStatus = gitlabInt?.status ?? IntegrationStatus.NOT_CONFIGURED;
  const gitlabChip = statusChipProps(gitlabStatus);

  const driveStatus = driveInt?.status ?? IntegrationStatus.NOT_CONFIGURED;
  const driveChip = statusChipProps(driveStatus);
  const driveConnected = driveInt?.hasCredentials === true;

  const handleConnectGoogleDrive = async () => {
    setError(null);
    setDriveConnecting(true);

    try {
      let integrationId = driveInt?.id;

      if (!integrationId) {
        const res = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'google_drive',
            agentId: null,
            config: { accessType: 'reader' },
            reason: 'System-level Google Drive connection',
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to create integration');
        }
        const { integration } = await res.json();
        integrationId = integration.id;
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google OAuth Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env');
      }
      const redirectUri = `${window.location.origin}/api/integrations/google/callback`;
      const scope = 'https://www.googleapis.com/auth/drive.readonly';
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(integrationId!)}`;
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setDriveConnecting(false);
    }
  };

  return (
    <PageContainer>
      <Header title="Integrations" subtitle="Manage system-level service connections" />

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {/* GitLab Connection Card */}
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CodeIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h3">{INTEGRATION_LABELS[IntegrationType.GITLAB]}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    System API connection for repository and issue management
                  </Typography>
                </Box>
                <Chip
                  label={INTEGRATION_STATUS_LABELS[gitlabStatus]}
                  size="small"
                  variant="outlined"
                  color={gitlabChip.color}
                  icon={gitlabChip.icon}
                  sx={{ height: 26, fontSize: '0.75rem' }}
                />
              </Box>

              {gitlabInt ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Instance
                    </Typography>
                    <Typography variant="body2">
                      {(gitlabConfig.instanceUrl as string) || 'Not set'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Credentials
                    </Typography>
                    <Typography variant="body2" color={gitlabInt.hasCredentials ? 'success.main' : 'text.disabled'}>
                      {gitlabInt.hasCredentials ? 'API token stored' : 'No token configured'}
                    </Typography>
                  </Box>
                  {typeof gitlabConfig.defaultNamespace === 'string' && gitlabConfig.defaultNamespace && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                        Namespace
                      </Typography>
                      <Typography variant="body2">
                        {gitlabConfig.defaultNamespace}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Last Updated
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(gitlabInt.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ pl: 0.5 }}>
                  No GitLab connection configured. Set up an API token to enable repository and issue integrations.
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => { setDialogExisting(gitlabInt); setDialogOpen(true); }}
                >
                  {gitlabInt ? 'Edit Connection' : 'Configure'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Google Drive Connection Card */}
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FolderIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h3">{INTEGRATION_LABELS[IntegrationType.GOOGLE_DRIVE]}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Knowledge workspace access and document retrieval
                  </Typography>
                </Box>
                <Chip
                  label={INTEGRATION_STATUS_LABELS[driveStatus]}
                  size="small"
                  variant="outlined"
                  color={driveChip.color}
                  icon={driveChip.icon}
                  sx={{ height: 26, fontSize: '0.75rem' }}
                />
              </Box>

              {driveConnected ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="body2">Google account connected</Typography>
                    <Chip label="OAuth 2.0" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', ml: 0.5 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Browse and select files from the Knowledge workspace. Selected documents are automatically extracted and stored as knowledge context.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                      Last Updated
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(driveInt!.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.disabled">
                      No Google account connected
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Connect your Google account to browse Drive files and add them to the knowledge workspace. Documents are automatically extracted and stored as context for agents.
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant={driveConnected ? 'outlined' : 'contained'}
                  startIcon={driveConnecting ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}
                  onClick={handleConnectGoogleDrive}
                  disabled={driveConnecting}
                >
                  {driveConnected ? 'Reconnect' : 'Connect Google Drive'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      <IntegrationConfigDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadData}
        type={IntegrationType.GITLAB}
        existing={dialogExisting}
      />
    </PageContainer>
  );
}
