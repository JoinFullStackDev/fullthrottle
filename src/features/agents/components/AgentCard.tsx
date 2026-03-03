'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import type { Agent } from '@/lib/types';
import { AgentStatus } from '@/lib/constants';

const AGENT_AVATARS: Record<string, string> = {
  Axel: 'AX',
  Riff: 'RF',
  Torque: 'TQ',
};

interface AgentCardProps {
  agent: Agent;
  taskCount?: number;
  onDisable?: (agentId: string) => void;
}

export default function AgentCard({ agent, taskCount = 0, onDisable }: AgentCardProps) {
  const isDisabled = agent.status === AgentStatus.DISABLED;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 44,
              height: 44,
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            {AGENT_AVATARS[agent.name] ?? agent.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3">{agent.name}</Typography>
            <Typography variant="caption">{agent.role}</Typography>
          </Box>
          <StatusBadge status={agent.status} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Chip label={`Persona ${agent.basePersonaVersion}`} size="small" variant="outlined" />
          <Chip label={`${taskCount} task${taskCount !== 1 ? 's' : ''}`} size="small" variant="outlined" />
        </Box>

        <Typography variant="caption" color="text.disabled">
          Model: {agent.defaultModel}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          component={Link}
          href={`/agents/${agent.id}`}
          size="small"
          variant="outlined"
        >
          View
        </Button>
        <Button
          component={Link}
          href={`/agents/${agent.id}?tab=1`}
          size="small"
          variant="outlined"
        >
          Edit
        </Button>
        <Button
          size="small"
          color={isDisabled ? 'primary' : 'error'}
          variant="outlined"
          onClick={() => onDisable?.(agent.id)}
        >
          {isDisabled ? 'Enable' : 'Disable'}
        </Button>
      </CardActions>
    </Card>
  );
}
