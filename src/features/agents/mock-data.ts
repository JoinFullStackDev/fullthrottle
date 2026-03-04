import type { Agent } from '@/lib/types';
import { AgentStatus } from '@/lib/constants';

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-axel',
    name: 'Axel',
    role: 'Engineering',
    description: 'The engineering crew chief: he maps the terrain, calls the risks, and lays out the cleanest build plan.',
    basePersonaVersion: 'v1.0',
    status: AgentStatus.OFFLINE,
    defaultModel: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    runtimeAgentId: null,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z',
  },
  {
    id: 'agent-riff',
    name: 'Riff',
    role: 'Product',
    description: 'Riff turns ambiguity into scope and scope into tickets that engineering and QA can execute without guessing.',
    basePersonaVersion: 'v1.0',
    status: AgentStatus.OFFLINE,
    defaultModel: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    runtimeAgentId: null,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z',
  },
  {
    id: 'agent-torque',
    name: 'Torque',
    role: 'QA',
    description: 'Torque applies pressure until the weak points show up — then turns that into a concrete validation plan.',
    basePersonaVersion: 'v1.0',
    status: AgentStatus.OFFLINE,
    defaultModel: 'gemini-2.5-flash',
    provider: 'google',
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
