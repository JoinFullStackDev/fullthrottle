'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import CodeIcon from '@mui/icons-material/CodeOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import type { DocumentCitation } from '../types';

interface DocumentCitationCardProps {
  citation: DocumentCitation;
  isActive: boolean;
  onToggle: () => void;
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  google_drive: CloudIcon,
  gitlab: CodeIcon,
  upload: UploadFileIcon,
};

const SOURCE_LABELS: Record<string, string> = {
  google_drive: 'Google Drive',
  gitlab: 'GitLab',
  upload: 'Upload',
  internal: 'Internal',
};

export default function DocumentCitationCard({
  citation,
  isActive,
  onToggle,
}: DocumentCitationCardProps) {
  const Icon = SOURCE_ICONS[citation.sourceType] ?? InsertDriveFileIcon;
  const sourceLabel = SOURCE_LABELS[citation.sourceType] ?? citation.sourceType;
  const isStaleOrError = citation.status === 'stale' || citation.status === 'error';

  return (
    <Paper
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        cursor: 'pointer',
        borderColor: isActive ? 'primary.main' : 'divider',
        bgcolor: isActive ? 'action.selected' : 'background.paper',
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': {
          borderColor: 'primary.dark',
          bgcolor: 'action.hover',
        },
      }}
    >
      <Icon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={600}
            noWrap
            sx={{ maxWidth: 180 }}
          >
            {citation.name}
          </Typography>
          {isStaleOrError && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: citation.status === 'error' ? 'error.main' : 'warning.main',
                flexShrink: 0,
              }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
          {sourceLabel}
        </Typography>
      </Box>
    </Paper>
  );
}
