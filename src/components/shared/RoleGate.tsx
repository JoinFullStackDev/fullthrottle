'use client';

import { useAuth } from '@/hooks/useAuth';
import { can, type Action } from '@/lib/permissions';

interface RoleGateProps {
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGate({ action, children, fallback = null }: RoleGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || !can(user.role, action)) return <>{fallback}</>;

  return <>{children}</>;
}
