'use client';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import type { Agent } from '@/lib/types';
import { getAgentColor } from '@/lib/agent-colors';

interface AgentConversationCardProps {
  agent: Agent;
  conversationCount: number;
}

export default function AgentConversationCard({
  agent,
  conversationCount,
}: AgentConversationCardProps) {
  const color = getAgentColor(agent.id);
  const imgSrc = agent.avatarUrl ?? `/agents/${agent.name.toLowerCase()}.png`;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 0 28px ${color}35, inset 0 0 60px ${color}08`,
          transform: 'translateY(-2px)',
          '& .hero-image': {
            transform: 'scale(1.05)',
          },
          '& .hero-shine': {
            opacity: 1,
          },
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/conversations/agent/${agent.id}`}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* Hero image area */}
        <Box
          sx={{
            position: 'relative',
            height: 280,
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <Box
            className="hero-image"
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${imgSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              transition: 'transform 0.4s ease',
            }}
          />

          {/* Accent line at top */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }}
          />

          {/* Diagonal shine on hover */}
          <Box
            className="hero-shine"
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, transparent 40%, ${color}12 50%, transparent 60%)`,
              opacity: 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
            }}
          />

          {/* Bottom gradient overlay with agent info */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
              px: 2,
              pb: 1.5,
              pt: 6,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  color: 'common.white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                {agent.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: color,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {agent.role}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end', flexShrink: 0 }}>
              <Chip
                label={agent.provider}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'common.white',
                  borderColor: `${color}60`,
                  border: '1px solid',
                }}
              />
              <Chip
                label={agent.defaultModel}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'common.white',
                  borderColor: `${color}60`,
                  border: '1px solid',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Card body */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: `${color}25`,
          }}
        >
          {agent.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.6,
                fontSize: '0.8rem',
              }}
            >
              {agent.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 'auto' }}>
            <StatusBadge status={agent.status} />
            <Chip
              icon={<ChatBubbleOutlineIcon sx={{ fontSize: 13 }} />}
              label={`${conversationCount} conversation${conversationCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.65rem' }}
            />
            <Chip
              label={`v${agent.basePersonaVersion}`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.65rem', ml: 'auto' }}
            />
          </Box>
        </Box>

        {/* Bottom accent line */}
        <Box
          sx={{
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
          }}
        />
      </CardActionArea>
    </Card>
  );
}
