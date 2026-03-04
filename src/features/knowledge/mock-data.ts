import type { KnowledgeSource } from '@/lib/types';

const defaults = {
  sourceType: 'manual' as const,
  externalId: null,
  integrationId: null,
  agentId: null,
  folderTag: null,
  projectTag: null,
  contentHash: null,
  lastFetchedAt: null,
  lastModifiedAt: null,
  fetchStatus: 'never_fetched',
  refreshIntervalMinutes: 60,
  mimeType: null,
};

export const MOCK_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  { ...defaults, id: 'ks-1', name: 'FullThrottle Architecture', type: 'Architecture', path: 'brain/architecture/fullthrottle.md', folderTag: 'architecture', createdAt: '2025-12-01T00:00:00Z' },
  { ...defaults, id: 'ks-2', name: 'FullThrottle SOW', type: 'SOW', path: 'brain/sow/fullthrottle-phase1.md', folderTag: 'sow', createdAt: '2025-11-15T00:00:00Z' },
  { ...defaults, id: 'ks-3', name: 'QA Standards', type: 'QA', path: 'brain/qa/standards.md', folderTag: 'qa', createdAt: '2025-11-20T00:00:00Z' },
  { ...defaults, id: 'ks-4', name: 'Product Requirements — Phase 1', type: 'PRD', path: 'brain/prd/fullthrottle-phase1.md', folderTag: 'prd', createdAt: '2025-12-05T00:00:00Z' },
  { ...defaults, id: 'ks-5', name: 'Operations Playbook', type: 'Ops', path: 'brain/ops/playbook.md', folderTag: 'ops', createdAt: '2025-12-10T00:00:00Z' },
];
