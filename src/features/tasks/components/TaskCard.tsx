'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MuiLink from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import type { Task } from '@/lib/types';
import { OwnerType, PRIORITY_LABELS, KNOWN_AGENT_ID_TO_NAME } from '@/lib/constants';
import type { TaskPriorityValue } from '@/lib/constants';
import type { AgentState } from './KanbanBoard';

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
  @keyframes amberPulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.3); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

const STATE_CONFIG: Record<
  AgentState,
  { dotColor: string; animation: string; label: string; borderColor: string } | null
> = {
  active: {
    dotColor: '#4CAF50',
    animation: 'taskPulse 1.8s ease-in-out infinite',
    label: '',
    borderColor: '#4CAF50',
  },
  waiting: {
    dotColor: '#FFA726',
    animation: 'amberPulse 2.2s ease-in-out infinite',
    label: 'Waiting',
    borderColor: '#FFA726',
  },
  stalled: {
    dotColor: '#EF5350',
    animation: 'taskPulse 1.4s ease-in-out infinite',
    label: 'Stalled',
    borderColor: '#EF5350',
  },
  idle: null,
};

interface TaskCardProps {
  task: Task;
  ownerName?: string;
  agentState?: AgentState;
  onReengage?: (taskId: string) => Promise<void>;
}

export default function TaskCard({ task, ownerName, agentState = 'idle', onReengage }: TaskCardProps) {
  const [isReengaging, setIsReengaging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const displayName =
    ownerName ??
    (task.ownerType === OwnerType.AGENT ? KNOWN_AGENT_ID_TO_NAME[task.ownerId] : undefined) ??
    task.ownerId;
  const stateConfig = STATE_CONFIG[agentState];
  const canReengage =
    task.ownerType === OwnerType.AGENT &&
    (agentState === 'stalled' || agentState === 'waiting') &&
    Boolean(onReengage);

  const handleReengage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onReengage || isReengaging) return;
    setIsReengaging(true);
    try {
      await onReengage(task.id);
    } finally {
      setIsReengaging(false);
    }
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <Card
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          mb: 1,
          cursor: 'grab',
          position: 'relative',
          '&:active': { cursor: 'grabbing' },
          ...(stateConfig && {
            borderLeft: `2px solid ${stateConfig.borderColor}`,
          }),
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Title row with optional pulse dot + state badge */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 0.5 }}>
            {stateConfig && (
              <Box
                sx={{
                  mt: '4px',
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: stateConfig.dotColor,
                  animation: stateConfig.animation,
                }}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
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

            {/* Re-engage button — visible on hover for stalled/waiting, always visible for stalled */}
            {canReengage && (agentState === 'stalled' || hovered) && (
              <Tooltip title="Re-engage agent" placement="top" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleReengage}
                    disabled={isReengaging}
                    sx={{
                      p: 0.25,
                      flexShrink: 0,
                      color: agentState === 'stalled' ? '#EF5350' : '#FFA726',
                      '&:hover': { color: 'text.primary' },
                    }}
                  >
                    {isReengaging ? (
                      <CircularProgress size={14} sx={{ color: 'inherit' }} />
                    ) : (
                      <PlayCircleOutlineIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          {/* State badge for waiting/stalled */}
          {stateConfig?.label && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, pl: stateConfig ? 2 : 0 }}>
              <Chip
                label={stateConfig.label}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  bgcolor: agentState === 'stalled' ? 'rgba(239,83,80,0.12)' : 'rgba(255,167,38,0.12)',
                  color: stateConfig.borderColor,
                  border: `1px solid ${stateConfig.borderColor}`,
                  fontWeight: 600,
                }}
              />
            </Box>
          )}

          {/* Live status text for active tasks */}
          {agentState === 'active' && task.lastRuntimeStatus && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.75,
                color: '#4CAF50',
                fontSize: '0.68rem',
                fontStyle: 'italic',
                pl: 2,
              }}
            >
              {task.lastRuntimeStatus}
            </Typography>
          )}

          {/* Re-engage context (last re-engage note) */}
          {agentState !== 'active' && task.lastRuntimeStatus === 'Re-engaged by user' && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.75,
                color: 'text.disabled',
                fontSize: '0.66rem',
                fontStyle: 'italic',
                pl: stateConfig ? 2 : 0,
              }}
            >
              Re-engaged
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
