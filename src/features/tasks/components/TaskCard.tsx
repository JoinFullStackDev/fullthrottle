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

const pulseKeyframes = `
  @keyframes taskPulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.4); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

interface TaskCardProps {
  task: Task;
  ownerName?: string;
}

export default function TaskCard({ task, ownerName }: TaskCardProps) {
  const displayName = ownerName ?? task.ownerId;
  const isActive = task.status === 'in_progress';

  return (
    <>
      <style>{pulseKeyframes}</style>
      <Card
        sx={{
          mb: 1,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          ...(isActive && {
            borderLeft: '2px solid #4CAF50',
          }),
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Title row with optional pulse dot */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 0.5 }}>
            {isActive && (
              <Box
                sx={{
                  mt: '4px',
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#4CAF50',
                  animation: 'taskPulse 1.8s ease-in-out infinite',
                }}
              />
            )}
            <MuiLink
              component={NextLink}
              href={`/tasks/${task.id}`}
              variant="body2"
              fontWeight={500}
              underline="hover"
              color="text.primary"
              sx={{ display: 'block' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {task.title}
            </MuiLink>
          </Box>

          {/* Live status text for in-progress tasks */}
          {isActive && task.lastRuntimeStatus && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.75,
                color: '#4CAF50',
                fontSize: '0.68rem',
                fontStyle: 'italic',
                pl: isActive ? 2 : 0,
              }}
            >
              {task.lastRuntimeStatus}
            </Typography>
          )}

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
    </>
  );
}
