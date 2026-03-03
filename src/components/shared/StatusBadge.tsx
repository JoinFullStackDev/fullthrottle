'use client';

import Chip from '@mui/material/Chip';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import PauseCircleIcon from '@mui/icons-material/PauseCircleOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import type { AgentStatusValue } from '@/lib/constants';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactElement }
> = {
  active: {
    label: 'Active',
    color: '#66BB6A',
    icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  },
  idle: {
    label: 'Idle',
    color: '#C9A84C',
    icon: <PauseCircleIcon sx={{ fontSize: 14 }} />,
  },
  offline: {
    label: 'Offline',
    color: '#9E9EB0',
    icon: <CircleIcon sx={{ fontSize: 14 }} />,
  },
  disabled: {
    label: 'Disabled',
    color: '#CF6679',
    icon: <CancelIcon sx={{ fontSize: 14 }} />,
  },
  error: {
    label: 'Error',
    color: '#CF6679',
    icon: <ErrorIcon sx={{ fontSize: 14 }} />,
  },
  planned: {
    label: 'Planned',
    color: '#5C6BC0',
    icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
  },
};

interface StatusBadgeProps {
  status: AgentStatusValue | string;
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size={size}
      variant="outlined"
      sx={{
        borderColor: config.color,
        color: config.color,
        '& .MuiChip-icon': {
          color: config.color,
        },
      }}
    />
  );
}
