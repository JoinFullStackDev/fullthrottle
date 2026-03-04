'use client';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import type { Agent } from '@/lib/types';

interface AgentConversationCardProps {
  agent: Agent;
  conversationCount: number;
}

export default function AgentConversationCard({
  agent,
  conversationCount,
}: AgentConversationCardProps) {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 0.15s ease',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/conversations/agent/${agent.id}`}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pt: 3 }}>
          <Avatar
            src={`/agents/${agent.name.toLowerCase()}.png`}
            sx={{
              bgcolor: 'primary.main',
              width: 80,
              height: 80,
              fontSize: '1.5rem',
              fontWeight: 700,
              mb: 2,
            }}
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </Avatar>

          <Typography variant="h3" sx={{ mb: 0.25 }}>
            {agent.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
            {agent.role}
          </Typography>

          {agent.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {agent.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mb: 1.5 }}>
            <Chip
              label={agent.provider}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Chip
              label={agent.defaultModel}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Chip
              label={`Persona ${agent.basePersonaVersion}`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 'auto' }}>
            <StatusBadge status={agent.status} />
            <Chip
              icon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
              label={`${conversationCount} conversation${conversationCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
