import type { KnowledgeSource } from '@/lib/types';

export const MOCK_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'ks-1',
    name: 'FullThrottle Architecture',
    type: 'Architecture',
    path: 'brain/architecture/fullthrottle.md',
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'ks-2',
    name: 'FullThrottle SOW',
    type: 'SOW',
    path: 'brain/sow/fullthrottle-phase1.md',
    createdAt: '2025-11-15T00:00:00Z',
  },
  {
    id: 'ks-3',
    name: 'QA Standards',
    type: 'QA',
    path: 'brain/qa/standards.md',
    createdAt: '2025-11-20T00:00:00Z',
  },
  {
    id: 'ks-4',
    name: 'Product Requirements — Phase 1',
    type: 'PRD',
    path: 'brain/prd/fullthrottle-phase1.md',
    createdAt: '2025-12-05T00:00:00Z',
  },
  {
    id: 'ks-5',
    name: 'Operations Playbook',
    type: 'Ops',
    path: 'brain/ops/playbook.md',
    createdAt: '2025-12-10T00:00:00Z',
  },
];
