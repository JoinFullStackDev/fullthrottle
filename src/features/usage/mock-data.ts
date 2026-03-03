import type { User } from '@/lib/types';
import { UserRole } from '@/lib/constants';

export const MOCK_USERS: User[] = [
  {
    id: 'user-spencer',
    name: 'Spencer',
    email: 'spencer@fullstack.dev',
    role: UserRole.SUPER_ADMIN,
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'user-alex',
    name: 'Alex',
    email: 'alex@fullstack.dev',
    role: UserRole.ADMIN,
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'user-jordan',
    name: 'Jordan',
    email: 'jordan@fullstack.dev',
    role: UserRole.TEAM_LEAD,
    createdAt: '2025-11-15T00:00:00Z',
  },
  {
    id: 'user-morgan',
    name: 'Morgan',
    email: 'morgan@fullstack.dev',
    role: UserRole.CONTRIBUTOR,
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'user-casey',
    name: 'Casey',
    email: 'casey@fullstack.dev',
    role: UserRole.VIEWER,
    createdAt: '2025-12-15T00:00:00Z',
  },
];
