'use client';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Chip from '@mui/material/Chip';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import type { RoundTableConversation } from '@/features/conversations/service';

interface RoundTableCardProps {
  conversation: RoundTableConversation;
  onClick: (conversation: RoundTableConversation) => void;
}

export default function RoundTableCard({ conversation, onClick }: RoundTableCardProps) {
  const { participants } = conversation;

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
        onClick={() => onClick(conversation)}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            pt: 3,
          }}
        >
          <AvatarGroup
            max={4}
            sx={{
              mb: 2,
              '& .MuiAvatar-root': { width: 52, height: 52, fontSize: '1rem', fontWeight: 700 },
            }}
          >
            {participants.map((p) => (
              <Avatar
                key={p.id}
                src={`/agents/${p.name.toLowerCase()}.png`}
                sx={{ bgcolor: 'primary.main' }}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>

          <Typography variant="h3" sx={{ mb: 0.25 }}>
            Round Table
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
            {participants.map((p) => p.name).join(', ')}
          </Typography>

          {conversation.title && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.5,
              }}
            >
              {conversation.title}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 'auto' }}>
            <Chip
              icon={<GroupsOutlinedIcon sx={{ fontSize: 14 }} />}
              label={`${participants.length} agents`}
              size="small"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
            <Chip
              label={new Date(conversation.createdAt).toLocaleDateString()}
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
