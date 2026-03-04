'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import type { SenderTypeValue } from '@/lib/constants';
import { SenderType } from '@/lib/constants';

interface MessageHeaderProps {
  senderType: SenderTypeValue;
  senderName?: string;
  avatarUrl?: string;
  agentAvatarUrl?: string;
  agentName?: string;
  timestamp: string;
  direction: 'row' | 'row-reverse';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function MessageHeader({
  senderType,
  senderName,
  avatarUrl,
  agentAvatarUrl,
  agentName,
  timestamp,
  direction,
}: MessageHeaderProps) {
  const isAgent = senderType === SenderType.AGENT;
  const isSystem = senderType === SenderType.SYSTEM;

  const agentAvatarName = agentName ?? (isAgent && senderName ? senderName : undefined);
  const agentSrc = isAgent
    ? (agentAvatarUrl ?? (agentAvatarName ? `/agents/${agentAvatarName.toLowerCase()}.png` : undefined))
    : undefined;
  const humanSrc = !isAgent && !isSystem ? avatarUrl : undefined;
  const src = agentSrc ?? humanSrc;

  const displayName = senderName ?? (isAgent ? agentName : undefined) ?? senderType;

  const fallbackContent = isAgent ? (
    <SmartToyIcon sx={{ fontSize: 18 }} />
  ) : isSystem ? (
    <SettingsIcon sx={{ fontSize: 18 }} />
  ) : senderName ? (
    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{getInitials(senderName)}</Typography>
  ) : (
    <PersonIcon sx={{ fontSize: 18 }} />
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: direction }}>
      <Avatar
        src={src}
        sx={{
          width: 32,
          height: 32,
          bgcolor: isAgent
            ? 'primary.main'
            : isSystem
              ? 'text.disabled'
              : 'action.selected',
          flexShrink: 0,
          fontSize: 13,
        }}
      >
        {fallbackContent}
      </Avatar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography variant="caption" fontWeight={600}>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
}
