'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import IconButton from '@mui/material/IconButton';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import ConversationThread from '@/features/conversations/components/ConversationThread';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/features/conversations/mock-data';

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedConversation = MOCK_CONVERSATIONS.find((c) => c.id === selectedId);
  const selectedMessages = selectedId ? MOCK_MESSAGES[selectedId] ?? [] : [];

  return (
    <PageContainer>
      <Header title="Conversations" subtitle="Agent conversation logs" />

      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{ mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
      >
        Conversations will sync from the agent runtime in a future release. This view shows mock data.
      </Alert>

      {selectedId && selectedConversation ? (
        <SectionContainer
          title={`Conversation with ${selectedConversation.agentName}`}
          actions={
            <IconButton onClick={() => setSelectedId(null)} size="small">
              <ArrowBackIcon />
            </IconButton>
          }
        >
          <Card sx={{ p: 3 }}>
            <ConversationThread messages={selectedMessages} />
          </Card>
        </SectionContainer>
      ) : (
        <Card>
          <List disablePadding>
            {MOCK_CONVERSATIONS.map((conv, idx) => (
              <Box key={conv.id}>
                <ListItemButton onClick={() => setSelectedId(conv.id)} sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <SmartToyIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {conv.agentName}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`${conv.messageCount} messages`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                  />
                  <Typography variant="caption" color="text.disabled">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </Typography>
                </ListItemButton>
                {idx < MOCK_CONVERSATIONS.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Card>
      )}
    </PageContainer>
  );
}
