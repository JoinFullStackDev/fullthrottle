'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';

interface StreamingMessageProps {
  content: string;
  agentName?: string;
}

export default function StreamingMessage({ content, agentName }: StreamingMessageProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'row' }}>
      <Avatar
        src={agentName ? `/agents/${agentName.toLowerCase()}.png` : undefined}
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
          flexShrink: 0,
        }}
      >
        <SmartToyIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'primary.dark',
          borderRadius: 2,
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" fontWeight={600}>
            {agentName ?? 'Agent'}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              gap: 0.5,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: 'pulse 1.4s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.4 },
                  '50%': { opacity: 1 },
                },
              }}
            />
            <Typography variant="caption" color="text.disabled">
              typing
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
        >
          {content || '\u200B'}
        </Typography>
      </Box>
    </Box>
  );
}
