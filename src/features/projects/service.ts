import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status as 'active' | 'archived',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(): Promise<Project[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProjectRow[]).map(rowToProject);
}

export async function listActiveProjects(): Promise<Project[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProjectRow[]).map(rowToProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return rowToProject(data as ProjectRow);
}

export interface CreateProjectInput {
  name: string;
  slug: string;
  description?: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? '',
    } as never)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToProject(data as ProjectRow);
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'status'>>,
): Promise<Project> {
  const supabase = createBrowserSupabaseClient();
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase
    .from('projects')
    .update(payload as never)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToProject(data as ProjectRow);
}
