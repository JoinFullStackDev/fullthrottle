import type { Agent } from '@/lib/types';
import { AgentStatus } from '@/lib/constants';

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-axel',
    name: 'Axel',
    role: 'Engineering',
    basePersonaVersion: 'v1.0',
    status: AgentStatus.OFFLINE,
    defaultModel: 'gpt-4o',
    runtimeAgentId: null,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z',
  },
  {
    id: 'agent-riff',
    name: 'Riff',
    role: 'Product',
    basePersonaVersion: 'v1.0',
    status: AgentStatus.OFFLINE,
    defaultModel: 'gpt-4o',
    runtimeAgentId: null,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z',
  },
  {
    id: 'agent-torque',
    name: 'Torque',
    role: 'QA',
    basePersonaVersion: 'v1.0',
    status: AgentStatus.OFFLINE,
    defaultModel: 'gpt-4o',
    runtimeAgentId: null,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z',
  },
];

export function getAgentById(id: string): Agent | undefined {
  return MOCK_AGENTS.find((a) => a.id === id);
}

export function getAgentName(id: string): string {
  return MOCK_AGENTS.find((a) => a.id === id)?.name ?? 'Unknown';
}
