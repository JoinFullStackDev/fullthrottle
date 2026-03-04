'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { PageContainer, Header, SectionContainer } from '@/components/layout';
import AgentConversationCard from '@/features/conversations/components/AgentConversationCard';
import RoundTableCard from '@/features/conversations/components/RoundTableCard';
import RoundTableDialog from '@/features/conversations/components/RoundTableDialog';
import ConversationThread from '@/features/conversations/components/ConversationThread';
import ChatInput from '@/features/conversations/components/ChatInput';
import type { ChatSendPayload } from '@/features/conversations/components/ChatInput';
import {
  listConversations,
  getConversationMessages,
  listRoundTableConversations,
} from '@/features/conversations/service';
import type { RoundTableConversation } from '@/features/conversations/service';
import { listAgents } from '@/features/agents/service';
import { listKnowledgeSources } from '@/features/knowledge/service';
import { useRoundTableStream } from '@/features/conversations/hooks/useRoundTableStream';
import type { Conversation, ConversationMessage, Agent, KnowledgeSource } from '@/lib/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [roundTableConvos, setRoundTableConvos] = useState<RoundTableConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roundTableOpen, setRoundTableOpen] = useState(false);

  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [roundTableAgents, setRoundTableAgents] = useState<Agent[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const {
    streamingContent,
    isStreaming,
    error: streamError,
    conversationId: streamConvId,
    currentAgent,
    send,
    reset,
  } = useRoundTableStream();

  const loadData = useCallback(async () => {
    const results: { agents?: Agent[]; convs?: Conversation[]; rt?: RoundTableConversation[]; ks?: KnowledgeSource[] } = {};
    try { results.agents = await listAgents(); } catch { /* */ }
    try { results.convs = await listConversations(); } catch { /* */ }
    try { results.rt = await listRoundTableConversations(); } catch { /* */ }
    try { results.ks = await listKnowledgeSources(); } catch { /* */ }
    return results;
  }, []);

  useEffect(() => {
    let mounted = true;
    loadData().then((r) => {
      if (!mounted) return;
      if (r.agents) setAgents(r.agents);
      if (r.convs) setConversations(r.convs);
      if (r.rt) setRoundTableConvos(r.rt);
      if (r.ks) setKnowledgeSources(r.ks);
      setIsLoading(false);
    });
    return () => { mounted = false; };
  }, [loadData]);

  const conversationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const conv of conversations) {
      if (conv.agentId) {
        counts[conv.agentId] = (counts[conv.agentId] || 0) + 1;
      }
    }
    return counts;
  }, [conversations]);

  const handleStartRoundTable = useCallback(
    (selectedAgents: Agent[]) => {
      reset();
      setRoundTableAgents(selectedAgents);
      setActiveConvId(null);
      setMessages([]);
    },
    [reset],
  );

  const handleResumeRoundTable = useCallback(
    async (conv: RoundTableConversation) => {
      reset();
      const participantAgents = agents.filter((a) =>
        conv.participants.some((p) => p.id === a.id),
      );
      if (participantAgents.length < 2) {
        setRoundTableAgents(
          conv.participants.map((p) => ({
            id: p.id,
            name: p.name,
            role: '',
            description: '',
            basePersonaVersion: '',
            status: 'active' as const,
            defaultModel: '',
            provider: '',
            runtimeAgentId: null,
            createdAt: '',
            updatedAt: '',
          })),
        );
      } else {
        setRoundTableAgents(participantAgents);
      }
      setActiveConvId(conv.id);
      try {
        const msgs = await getConversationMessages(conv.id);
        setMessages(msgs);
      } catch {
        setMessages([]);
      }
    },
    [reset, agents],
  );

  const handleSendMessage = useCallback(
    (payload: ChatSendPayload) => {
      if (roundTableAgents.length < 2) return;
      send({
        agentIds: roundTableAgents.map((a) => a.id),
        conversationId: activeConvId ?? streamConvId ?? undefined,
        message: payload.message,
        documentIds: payload.documentIds,
      });
    },
    [roundTableAgents, activeConvId, streamConvId, send],
  );

  const handleBack = useCallback(() => {
    reset();
    setRoundTableAgents([]);
    setActiveConvId(null);
    setMessages([]);
    listConversations().then(setConversations).catch(() => {});
    listRoundTableConversations().then(setRoundTableConvos).catch(() => {});
  }, [reset]);

  useEffect(() => {
    const convId = activeConvId ?? streamConvId;
    if (!isStreaming && streamingContent === '' && convId) {
      setActiveConvId(convId);
      getConversationMessages(convId).then(setMessages).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const inRoundTable = roundTableAgents.length > 0;
  const roundTableTitle = `Round Table: ${roundTableAgents.map((a) => a.name).join(', ')}`;

  if (isLoading) {
    return (
      <PageContainer>
        <Header title="Conversations" subtitle="Chat with your AI agent team" />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="Conversations" subtitle="Chat with your AI agent team" />

      {inRoundTable ? (
        <SectionContainer
          title={roundTableTitle}
          actions={
            <IconButton onClick={handleBack} size="small">
              <ArrowBackIcon />
            </IconButton>
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
              {messages.length === 0 && !isStreaming ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <GroupsOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Send a message to start the round table with{' '}
                    {roundTableAgents.map((a) => a.name).join(', ')}.
                  </Typography>
                </Box>
              ) : (
                <ConversationThread
                  messages={messages}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                  agentName={currentAgent?.name}
                  currentStreamingAgent={currentAgent}
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
              placeholder={`Message ${roundTableAgents.map((a) => a.name).join(', ')}...`}
              knowledgeSources={knowledgeSources}
            />
          </Card>
        </SectionContainer>
      ) : (
        <>
          {agents.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<GroupsOutlinedIcon />}
                onClick={() => setRoundTableOpen(true)}
                size="small"
              >
                Round Table
              </Button>
            </Box>
          )}

          {agents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No agents available. Set up agents first.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {agents.map((agent) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={agent.id}>
                    <AgentConversationCard
                      agent={agent}
                      conversationCount={conversationCounts[agent.id] ?? 0}
                    />
                  </Grid>
                ))}
              </Grid>

              {roundTableConvos.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    Round Tables
                  </Typography>
                  <Grid container spacing={3}>
                    {roundTableConvos.map((conv) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={conv.id}>
                        <RoundTableCard
                          conversation={conv}
                          onClick={handleResumeRoundTable}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </>
          )}
        </>
      )}

      <RoundTableDialog
        open={roundTableOpen}
        onClose={() => setRoundTableOpen(false)}
        onStart={handleStartRoundTable}
        agents={agents}
      />
    </PageContainer>
  );
}
