'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import type { Agent } from '@/lib/types';

interface RoundTableDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (agents: Agent[]) => void;
  agents: Agent[];
}

export default function RoundTableDialog({
  open,
  onClose,
  onStart,
  agents,
}: RoundTableDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleToggle = (agentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const handleStart = () => {
    const selectedAgents = agents.filter((a) => selected.has(a.id));
    onStart(selectedAgents);
    onClose();
    setSelected(new Set());
  };

  const handleClose = () => {
    onClose();
    setSelected(new Set());
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start a Round Table</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 3, pt: 1, pb: 1.5 }}>
          Select two or more agents to participate in a group conversation.
          Each agent will respond in sequence, seeing what the others said.
        </Typography>

        {selected.size > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', px: 3, pb: 1.5 }}>
            {agents
              .filter((a) => selected.has(a.id))
              .map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  size="small"
                  onDelete={() => handleToggle(a.id)}
                  avatar={
                    <Avatar
                      src={`/agents/${a.name.toLowerCase()}.png`}
                      sx={{ width: 20, height: 20 }}
                    >
                      {a.name[0]}
                    </Avatar>
                  }
                />
              ))}
          </Box>
        )}

        <List>
          {agents.map((agent) => (
            <ListItemButton
              key={agent.id}
              onClick={() => handleToggle(agent.id)}
              selected={selected.has(agent.id)}
            >
              <Checkbox
                edge="start"
                checked={selected.has(agent.id)}
                disableRipple
                sx={{ mr: 1 }}
              />
              <ListItemAvatar>
                <Avatar
                  src={agent.avatarUrl ?? `/agents/${agent.name.toLowerCase()}.png`}
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
                  <Typography variant="caption" color="text.secondary">
                    {agent.role} &middot; {agent.provider}/{agent.defaultModel}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} size="small">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={selected.size < 2}
          size="small"
        >
          Start Round Table ({selected.size} agents)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
