'use client';

import NextLink from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MuiLink from '@mui/material/Link';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import type { Task } from '@/lib/types';
import { OwnerType, PRIORITY_LABELS } from '@/lib/constants';
import type { TaskPriorityValue } from '@/lib/constants';

const PRIORITY_COLORS: Record<TaskPriorityValue, string> = {
  low: '#9E9EB0',
  medium: '#5C6BC0',
  high: '#C9A84C',
  critical: '#CF6679',
};

interface TaskCardProps {
  task: Task;
  ownerName?: string;
}

export default function TaskCard({ task, ownerName }: TaskCardProps) {
  const displayName = ownerName ?? task.ownerId;

  return (
    <Card
      sx={{
        mb: 1,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <MuiLink
          component={NextLink}
          href={`/tasks/${task.id}`}
          variant="body2"
          fontWeight={500}
          underline="hover"
          color="text.primary"
          sx={{ mb: 1, display: 'block' }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {task.title}
        </MuiLink>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={
              task.ownerType === OwnerType.AGENT ? (
                <SmartToyIcon sx={{ fontSize: 14 }} />
              ) : (
                <PersonIcon sx={{ fontSize: 14 }} />
              )
            }
            label={displayName}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
          <Chip
            label={PRIORITY_LABELS[task.priority]}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              borderColor: PRIORITY_COLORS[task.priority],
              color: PRIORITY_COLORS[task.priority],
            }}
            variant="outlined"
          />
          {task.projectTag && (
            <Chip
              label={task.projectTag}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
          {new Date(task.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
}
