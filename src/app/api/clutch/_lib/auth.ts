import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export async function authenticateClutchBearer(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export const AGENT_SLUG_TO_ID: Record<string, string> = {
  axel: 'a0000000-0000-0000-0000-000000000001',
  riff: 'a0000000-0000-0000-0000-000000000002',
  torque: 'a0000000-0000-0000-0000-000000000003',
  clutch: 'a0000000-0000-0000-0000-000000000004',
};

export const CLUTCH_AGENT_ID = 'a0000000-0000-0000-0000-000000000004';
