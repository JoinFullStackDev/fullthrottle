'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { PageContainer, Header } from '@/components/layout';
import AgentCard from '@/features/agents/components/AgentCard';
import { useAgents } from '@/features/agents/hooks/useAgents';
import { updateAgent } from '@/features/agents/service';
import { useAuth } from '@/hooks/useAuth';
import { AgentStatus } from '@/lib/constants';

export default function AgentsPage() {
  const { agents, isLoading, error, refetch } = useAgents();
  const { user } = useAuth();

  const handleDisable = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const newStatus = agent.status === AgentStatus.DISABLED
      ? AgentStatus.OFFLINE
      : AgentStatus.DISABLED;
    await updateAgent(
      agentId,
      { status: newStatus },
      user ? { actorId: user.id, reason: `Agent ${newStatus === AgentStatus.DISABLED ? 'disabled' : 're-enabled'} via Control Center` } : undefined,
    );
    refetch();
  };

  return (
    <PageContainer>
      <Header
        title="Agents"
        subtitle="Manage AI agent personas and configuration"
        actions={
          <Button
            component={Link}
            href="/agents/new"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            New Agent
          </Button>
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!isLoading && !error && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              taskCount={0}
              onDisable={handleDisable}
            />
          ))}
        </Box>
      )}
    </PageContainer>
  );
}
