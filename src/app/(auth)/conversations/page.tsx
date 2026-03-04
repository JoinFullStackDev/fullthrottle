'use client';

import { useState, useEffect, useCallback } from 'react';
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
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import IconButton from '@mui/material/IconButton';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import ConversationThread from '@/features/conversations/components/ConversationThread';
import ChatInput from '@/features/conversations/components/ChatInput';
import NewConversationDialog from '@/features/conversations/components/NewConversationDialog';
import { listConversations, getConversationMessages } from '@/features/conversations/service';
import { listAgents } from '@/features/agents/service';
import { useChatStream } from '@/features/conversations/hooks/useChatStream';
import { CHANNEL_LABELS } from '@/lib/constants';
import type { Conversation, ConversationMessage, Agent } from '@/lib/types';
import type { ConversationChannelValue } from '@/lib/constants';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    streamingContent,
    isStreaming,
    error: streamError,
    conversationId: streamConvId,
    send,
    reset,
  } = useChatStream();

  useEffect(() => {
    Promise.all([listConversations(), listAgents()])
      .then(([convs, ags]) => {
        setConversations(convs);
        setAgents(ags);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = useCallback(
    async (id: string) => {
      reset();
      setSelectedId(id);
      setMessagesLoading(true);

      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        const agent = agents.find((a) => a.id === conv.agentId);
        setSelectedAgent(agent ?? null);
      }

      try {
        const msgs = await getConversationMessages(id);
        setMessages(msgs);
      } catch {
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [conversations, agents, reset],
  );

  const handleNewConversation = useCallback(
    (agent: Agent) => {
      reset();
      setSelectedAgent(agent);
      setSelectedId(null);
      setMessages([]);
    },
    [reset],
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!selectedAgent) return;

      const convId = selectedId ?? streamConvId ?? undefined;

      send({
        agentId: selectedAgent.id,
        conversationId: convId,
        message,
      });
    },
    [selectedAgent, selectedId, streamConvId, send],
  );

  const handleBack = useCallback(() => {
    reset();
    setSelectedId(null);
    setSelectedAgent(null);
    setMessages([]);
    listConversations().then(setConversations).catch(() => {});
  }, [reset]);

  // After streaming completes, reload messages to get the stored version
  useEffect(() => {
    const convId = selectedId ?? streamConvId;
    if (!isStreaming && streamingContent && convId) {
      setSelectedId(convId);
      getConversationMessages(convId).then(setMessages).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const inChat = selectedId || selectedAgent;
  const chatTitle = selectedConversation
    ? selectedConversation.title ?? `Chat with ${selectedConversation.agentName ?? 'Agent'}`
    : selectedAgent
      ? `New conversation with ${selectedAgent.name}`
      : 'Conversation';

  if (isLoading) {
    return (
      <PageContainer>
        <Header title="Conversations" subtitle="Agent conversation logs" />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Conversations" subtitle="Chat with your AI agent team" />

      {inChat ? (
        <SectionContainer
          title={chatTitle}
          actions={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedConversation?.channel === 'slack' && (
                <Chip
                  label="Slack"
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', borderColor: 'primary.main' }}
                />
              )}
              <IconButton onClick={handleBack} size="small">
                <ArrowBackIcon />
              </IconButton>
            </Box>
          }
        >
          <Card
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 280px)',
              minHeight: 400,
            }}
          >
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {messagesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 && !isStreaming ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Send a message to start talking to {selectedAgent?.name ?? 'the agent'}.
                  </Typography>
                </Box>
              ) : (
                <ConversationThread
                  messages={messages}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                  agentName={selectedAgent?.name}
                />
              )}
            </Box>

            {streamError && (
              <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
                {streamError}
              </Alert>
            )}

            <ChatInput
              onSend={handleSendMessage}
              disabled={isStreaming || !selectedAgent}
              placeholder={
                selectedAgent
                  ? `Message ${selectedAgent.name} (${selectedAgent.provider}/${selectedAgent.defaultModel})...`
                  : 'Select an agent first...'
              }
            />
          </Card>
        </SectionContainer>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              size="small"
            >
              New Conversation
            </Button>
          </Box>

          <Card>
            {conversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No conversations yet.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogOpen(true)}
                >
                  Start your first conversation
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {conversations.map((conv, idx) => (
                  <Box key={conv.id}>
                    <ListItemButton onClick={() => handleSelect(conv.id)} sx={{ py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <SmartToyIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {conv.title ?? conv.agentName ?? 'Agent'}
                            </Typography>
                            {conv.agentName && conv.title && (
                              <Chip
                                label={conv.agentName}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 0.75, mt: 0.5 }}>
                            <Chip
                              label={CHANNEL_LABELS[conv.channel as ConversationChannelValue] ?? conv.channel}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                            <Chip
                              label={`${conv.messageCount ?? 0} messages`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          </Box>
                        }
                      />
                      <Typography variant="caption" color="text.disabled">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </Typography>
                    </ListItemButton>
                    {idx < conversations.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Card>
        </>
      )}

      <NewConversationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handleNewConversation}
        agents={agents}
      />
    </PageContainer>
  );
}
