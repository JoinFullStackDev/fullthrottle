'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { SectionContainer } from '@/components/layout';
import { listAuditLogs } from '@/features/audit/service';
import type { AuditLogEntry } from '@/lib/types';

interface Props {
  taskId: string;
}

export default function TaskActivityLog({ taskId }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listAuditLogs({ entityId: taskId, limit: 50 })
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (logs.length === 0) {
    return (
      <SectionContainer title="Activity">
        <Typography variant="body2" color="text.secondary">
          No activity recorded for this task.
        </Typography>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer title="Activity">
      <Card>
        <List disablePadding>
          {logs.map((log, idx) => (
            <Box key={log.id}>
              <ListItem sx={{ py: 1.5, px: 2 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={log.actionType.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem', textTransform: 'capitalize' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        by {log.actorName ?? 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {log.reason}
                      </Typography>
                      {log.afterState && (
                        <Box
                          sx={{
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            p: 1,
                            mt: 0.5,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'text.disabled',
                            whiteSpace: 'pre-wrap',
                            maxHeight: 120,
                            overflow: 'auto',
                          }}
                        >
                          {JSON.stringify(log.afterState, null, 2)}
                        </Box>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              {idx < logs.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>
    </SectionContainer>
  );
}
