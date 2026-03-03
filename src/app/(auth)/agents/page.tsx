'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { PageContainer, Header } from '@/components/layout';
import AgentCard from '@/features/agents/components/AgentCard';
import { MOCK_AGENTS } from '@/features/agents/mock-data';
import { MOCK_TASKS } from '@/features/tasks/mock-data';
import { AgentStatus } from '@/lib/constants';
import type { Agent } from '@/lib/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([...MOCK_AGENTS]);

  const handleDisable = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status:
                a.status === AgentStatus.DISABLED
                  ? AgentStatus.OFFLINE
                  : AgentStatus.DISABLED,
            }
          : a
      )
    );
  };

  return (
    <PageContainer>
      <Header title="Agents" subtitle="Manage AI agent personas and configuration" />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            taskCount={MOCK_TASKS.filter((t) => t.ownerId === agent.id).length}
            onDisable={handleDisable}
          />
        ))}
      </Box>
    </PageContainer>
  );
}
