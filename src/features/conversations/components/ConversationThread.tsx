'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import type { ConversationMessage } from '@/lib/types';
import { SenderType } from '@/lib/constants';

interface ConversationThreadProps {
  messages: ConversationMessage[];
}

export default function ConversationThread({ messages }: ConversationThreadProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {messages.map((msg) => {
        const isAgent = msg.senderType === SenderType.AGENT;
        const isSystem = msg.senderType === SenderType.SYSTEM;
        return (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: isAgent ? 'row' : 'row-reverse',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: isAgent
                  ? 'primary.main'
                  : isSystem
                    ? 'text.disabled'
                    : 'action.selected',
                flexShrink: 0,
              }}
            >
              {isAgent ? (
                <SmartToyIcon sx={{ fontSize: 18 }} />
              ) : isSystem ? (
                <SettingsIcon sx={{ fontSize: 18 }} />
              ) : (
                <PersonIcon sx={{ fontSize: 18 }} />
              )}
            </Avatar>
            <Box
              sx={{
                maxWidth: '70%',
                bgcolor: isAgent ? 'background.paper' : 'action.selected',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>
                  {msg.senderName ?? msg.senderType}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
              >
                {msg.content}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
