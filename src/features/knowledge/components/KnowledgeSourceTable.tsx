'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloudIcon from '@mui/icons-material/CloudOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/RefreshOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import HelpIcon from '@mui/icons-material/HelpOutlineOutlined';
import type { KnowledgeSource } from '@/lib/types';

interface KnowledgeSourceTableProps {
  sources: KnowledgeSource[];
  loading: boolean;
  refreshingId?: string | null;
  onRefresh: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function KnowledgeSourceTable({
  sources,
  loading,
  refreshingId,
  onRefresh,
  onDelete,
}: KnowledgeSourceTableProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
          {sources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No knowledge sources configured
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            sources.map((source) => (
              <TableRow key={source.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {source.sourceType === 'google_drive' ? (
                      <CloudIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    ) : source.sourceType === 'upload' ? (
                      <UploadFileIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    ) : (
                      <DescriptionIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    )}
                    <Typography variant="body2">{source.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      source.sourceType === 'google_drive'
                        ? 'Google Drive'
                        : source.sourceType === 'upload'
                          ? 'Upload'
                          : 'Manual'
                    }
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.65rem' }}
                  />
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
                  <Typography variant="caption" color="text.secondary">
                    {source.agentName ?? 'All'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {source.fetchStatus === 'fresh' && (
                      <><CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} /><Typography variant="caption">Fresh</Typography></>
                    )}
                    {source.fetchStatus === 'stale' && (
                      <><WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} /><Typography variant="caption">Stale</Typography></>
                    )}
                    {source.fetchStatus === 'error' && (
                      <><ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} /><Typography variant="caption">Error</Typography></>
                    )}
                    {source.fetchStatus === 'never_fetched' && (
                      <><HelpIcon sx={{ fontSize: 16, color: 'text.disabled' }} /><Typography variant="caption">Not fetched</Typography></>
                    )}
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
                        onClick={() => onRefresh(source.id)}
                        disabled={refreshingId === source.id}
                      >
                        {refreshingId === source.id ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton size="small" onClick={() => onDelete(source.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
