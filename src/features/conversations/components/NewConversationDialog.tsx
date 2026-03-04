'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import type { Agent } from '@/lib/types';

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (agent: Agent) => void;
  agents: Agent[];
}

export default function NewConversationDialog({
  open,
  onClose,
  onSelect,
  agents,
}: NewConversationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start a Conversation</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List>
          {agents.map((agent) => (
            <ListItemButton
              key={agent.id}
              onClick={() => {
                onSelect(agent);
                onClose();
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={`/agents/${agent.name.toLowerCase()}.png`}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  <SmartToyIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600}>
                    {agent.name}
                  </Typography>
                }
                secondary={
                  <Box
                    component="span"
                    sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}
                  >
                    <Chip
                      label={agent.role}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
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
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
