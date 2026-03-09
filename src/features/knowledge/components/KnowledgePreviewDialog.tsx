'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/CloseOutlined';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import { getKnowledgeContent } from '@/features/knowledge/service';
import type { KnowledgeSource } from '@/lib/types';

interface KnowledgePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  source: KnowledgeSource | null;
}

const GOOGLE_EMBEDDABLE_MIMES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/pdf',
]);

function getGoogleEmbedUrl(source: KnowledgeSource): string | null {
  if (source.sourceType !== 'google_drive' || !source.externalId) return null;
  if (!source.mimeType || !GOOGLE_EMBEDDABLE_MIMES.has(source.mimeType)) return null;

  if (source.mimeType === 'application/pdf') {
    return `https://drive.google.com/file/d/${source.externalId}/preview`;
  }
  if (source.mimeType === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${source.externalId}/preview`;
  }
  if (source.mimeType === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${source.externalId}/preview`;
  }
  return `https://docs.google.com/document/d/${source.externalId}/preview`;
}

function getGoogleOpenUrl(source: KnowledgeSource): string | null {
  if (source.sourceType !== 'google_drive' || !source.externalId) return null;
  return `https://drive.google.com/file/d/${source.externalId}/view`;
}

function formatMimeType(mime: string | null): string {
  if (!mime) return 'Unknown';
  const stripped = mime.replace('application/vnd.google-apps.', '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function SourceIcon({ sourceType }: { sourceType: string }) {
  if (sourceType === 'google_drive') return <CloudIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
  if (sourceType === 'upload') return <UploadFileIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
  return <DescriptionIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
}

export default function KnowledgePreviewDialog({
  open,
  onClose,
  source,
}: KnowledgePreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const embedUrl = source ? getGoogleEmbedUrl(source) : null;
  const openUrl = source ? getGoogleOpenUrl(source) : null;
  const hasEmbed = !!embedUrl;

  useEffect(() => {
    if (!open || !source) {
      setContent(null);
      setError(null);
      setActiveTab(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getKnowledgeContent(source.id)
      .then((text) => {
        if (cancelled) return;
        setContent(text);
      })
      .catch((err) => {
        if (cancelled) return;
        setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, source]);

  if (!source) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '85vh', display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6 }}>
        <SourceIcon sourceType={source.sourceType} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h3" noWrap>{source.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={formatMimeType(source.mimeType)}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            {source.projectTag && (
              <Chip
                label={source.projectTag}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
            {source.folderTag && (
              <Chip
                label={source.folderTag}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
            {source.fetchStatus === 'fresh' && (
              <Chip label="Fresh" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
            {source.fetchStatus === 'stale' && (
              <Chip label="Stale" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
            {source.fetchStatus === 'error' && (
              <Chip label="Error" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {hasEmbed && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Extracted Text" />
            <Tab label="Document Preview" />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {content ? (
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.7,
                  color: 'text.primary',
                  m: 0,
                }}
              >
                {content}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  No extracted content available for this source.
                </Typography>
                {source.fetchStatus === 'never_fetched' && (
                  <Typography variant="caption" color="text.disabled">
                    This source has not been fetched yet. Use the refresh button to extract its content.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {!loading && activeTab === 1 && hasEmbed && (
          <Box sx={{ width: '100%', height: '100%' }}>
            <iframe
              src={embedUrl!}
              title={source.name}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        {openUrl && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 'auto' }}
          >
            Open in Google Drive
          </Button>
        )}
        <Button onClick={onClose} variant="outlined" color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
