'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import StatusBadge from '@/components/shared/StatusBadge';
import ConversationThread from '@/features/conversations/components/ConversationThread';
import ChatInput from '@/features/conversations/components/ChatInput';
import type { ChatSendPayload } from '@/features/conversations/components/ChatInput';
import {
  listConversationsForAgent,
  getConversationMessages,
} from '@/features/conversations/service';
import { getAgentById } from '@/features/agents/service';
import { listKnowledgeSources } from '@/features/knowledge/service';
import { useChatStream } from '@/features/conversations/hooks/useChatStream';
import { CHANNEL_LABELS } from '@/lib/constants';
import type { Conversation, ConversationMessage, Agent, KnowledgeSource } from '@/lib/types';
import type { ConversationChannelValue } from '@/lib/constants';

export default function AgentConversationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inNewChat, setInNewChat] = useState(false);

  const {
    streamingContent,
    isStreaming,
    error: streamError,
    conversationId: streamConvId,
    send,
    reset,
  } = useChatStream();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const ag = await getAgentById(agentId);
        if (mounted) setAgent(ag);
      } catch (err) {
        console.error('[AgentConversations] Failed to load agent:', err);
      }
      try {
        const convs = await listConversationsForAgent(agentId);
        if (mounted) setConversations(convs);
      } catch (err) {
        console.error('[AgentConversations] Failed to load conversations:', err);
        if (mounted) setLoadError(err instanceof Error ? err.message : 'Failed to load conversations');
      }
      try {
        const ks = await listKnowledgeSources();
        if (mounted) setKnowledgeSources(ks);
      } catch { /* knowledge fetch failed — non-critical */ }
      if (mounted) setIsLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [agentId]);

  const handleSelect = useCallback(
    async (id: string) => {
      reset();
      setInNewChat(false);
      setSelectedId(id);
      setMessagesLoading(true);
      try {
        const msgs = await getConversationMessages(id);
        setMessages(msgs);
      } catch {
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [reset],
  );

  const handleNewChat = useCallback(() => {
    reset();
    setSelectedId(null);
    setMessages([]);
    setInNewChat(true);
  }, [reset]);

  const handleSendMessage = useCallback(
    (payload: ChatSendPayload) => {
      if (!agent) return;
      const convId = selectedId ?? streamConvId ?? undefined;
      send({
        agentId: agent.id,
        conversationId: convId,
        message: payload.message,
        documentIds: payload.documentIds,
      });
    },
    [agent, selectedId, streamConvId, send],
  );

  const handleBackToList = useCallback(() => {
    reset();
    setSelectedId(null);
    setInNewChat(false);
    setMessages([]);
    listConversationsForAgent(agentId).then(setConversations).catch(() => {});
  }, [reset, agentId]);

  useEffect(() => {
    const convId = selectedId ?? streamConvId;
    if (!isStreaming && streamingContent && convId) {
      setSelectedId(convId);
      getConversationMessages(convId).then(setMessages).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const inChat = selectedId || inNewChat;
  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const chatTitle = selectedConversation
    ? selectedConversation.title ?? `Chat with ${agent?.name ?? 'Agent'}`
    : `New conversation with ${agent?.name ?? 'Agent'}`;

  if (isLoading) {
    return (
      <PageContainer>
        <Header title="Conversations" subtitle="Loading..." />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!agent) {
    return (
      <PageContainer>
        <Header title="Conversations" subtitle="Agent not found" />
        <Alert severity="error" sx={{ mt: 2 }}>
          Agent not found. It may have been removed.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Conversations"
        subtitle={`Chat with ${agent.name}`}
      />

      {/* Agent profile bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={`/agents/${agent.name.toLowerCase()}.png`}
            sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 700 }}
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h3">{agent.name}</Typography>
              <StatusBadge status={agent.status} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {agent.role} &middot; {agent.provider}/{agent.defaultModel}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => router.push('/conversations')}
            startIcon={<ArrowBackIcon />}
          >
            All Agents
          </Button>
        </Box>
      </Card>

      {inChat ? (
        <SectionContainer
          title={chatTitle}
          actions={
            <IconButton onClick={handleBackToList} size="small">
              <ArrowBackIcon />
            </IconButton>
          }
        >
          <Card
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 360px)',
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
                    Send a message to start talking to {agent.name}.
                  </Typography>
                </Box>
              ) : (
                <ConversationThread
                  messages={messages}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                  agentName={agent.name}
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
              disabled={isStreaming}
              placeholder={`Message ${agent.name} (${agent.provider}/${agent.defaultModel})...`}
              knowledgeSources={knowledgeSources}
            />
          </Card>
        </SectionContainer>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewChat}
              size="small"
            >
              New Chat
            </Button>
          </Box>

          {loadError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}

          <Card>
            {conversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No conversations with {agent.name} yet.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewChat}
                >
                  Start your first conversation
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {conversations.map((conv, idx) => (
                  <Box key={conv.id}>
                    <ListItemButton onClick={() => handleSelect(conv.id)} sx={{ py: 2 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {conv.title ?? `Chat with ${agent.name}`}
                          </Typography>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 0.75, mt: 0.5 }}>
                            <Chip
                              label={
                                CHANNEL_LABELS[conv.channel as ConversationChannelValue] ??
                                conv.channel
                              }
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
    </PageContainer>
  );
}
