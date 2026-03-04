import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

type ProfileRow = Tables<'profiles'>;

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createBrowserSupabaseClient();
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${urlData.publicUrl}?t=${Date.now()}`;
}

export async function updateProfile(
  id: string,
  updates: { name?: string; avatar_url?: string | null },
): Promise<User> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToUser(data as ProfileRow);
}

export async function listProfiles(): Promise<User[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProfileRow[]).map(rowToUser);
}
