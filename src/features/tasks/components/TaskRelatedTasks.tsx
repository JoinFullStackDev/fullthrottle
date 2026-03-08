'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { SectionContainer } from '@/components/layout';
import { getTaskById, listTasksByParent } from '@/features/tasks/service';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';
import type { Task } from '@/lib/types';

const AGENT_LABELS: Record<string, string> = {
  axel: 'Axel (Engineering)',
  riff: 'Riff (Product)',
  torque: 'Torque (QA)',
};

interface Props {
  task: Task;
  ownerNames: Record<string, string>;
}

export default function TaskRelatedTasks({ task, ownerNames }: Props) {
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [childTasks, setChildTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const promises: Promise<unknown>[] = [];

        if (task.parentTaskId) {
          promises.push(
            getTaskById(task.parentTaskId).then((t) => setParentTask(t)),
          );
        }

        const intakeType = task.metadata?.intakeType as string | undefined;
        if (intakeType === 'parent') {
          promises.push(
            listTasksByParent(task.id).then((t) => setChildTasks(t)),
          );
        }

        await Promise.all(promises);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [task.id, task.parentTaskId, task.metadata?.intakeType]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {parentTask && (
        <SectionContainer title="Parent Intake Task">
          <Card
            component={NextLink}
            href={`/tasks/${parentTask.id}`}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ArrowUpwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={500}>
                  {parentTask.title}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Chip
                  label={TASK_STATUS_LABELS[parentTask.status]}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
                <Chip
                  label={PRIORITY_LABELS[parentTask.priority]}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                  {new Date(parentTask.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </SectionContainer>
      )}

      {childTasks.length > 0 && (
        <SectionContainer title={`Derived Tasks (${childTasks.length})`}>
          <Card>
            <List disablePadding>
              {childTasks.map((child, idx) => {
                const suggested = child.metadata?.suggestedAgent as string | undefined;
                return (
                  <Box key={child.id}>
                    <ListItemButton
                      component={NextLink}
                      href={`/tasks/${child.id}`}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {child.title}
                          </Typography>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Chip
                              label={TASK_STATUS_LABELS[child.status]}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={PRIORITY_LABELS[child.priority]}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                            {child.ownerId && ownerNames[child.ownerId] && (
                              <Chip
                                icon={<SmartToyIcon sx={{ fontSize: 14 }} />}
                                label={ownerNames[child.ownerId]}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                            {suggested && !child.ownerId && (
                              <Chip
                                icon={<LightbulbIcon sx={{ fontSize: 14 }} />}
                                label={AGENT_LABELS[suggested] ?? suggested}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.65rem', borderColor: 'primary.dark', color: 'primary.light' }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(child.createdAt).toLocaleDateString()}
                      </Typography>
                    </ListItemButton>
                    {idx < childTasks.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </List>
          </Card>
        </SectionContainer>
      )}

      {!parentTask && childTasks.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No related tasks.
        </Typography>
      )}
    </Box>
  );
}
