import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Doc, DocFolder, DocFile } from '@/lib/types';

// Use untyped client for doc_folders/docs/doc_files (added outside generated schema types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

// ─── Folders ──────────────────────────────────────────────────────────────────

function getClient(): AnyClient {
  return createBrowserSupabaseClient() as AnyClient;
}

export async function listFolders(): Promise<DocFolder[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('doc_folders')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToFolder);
}

export async function createFolder(params: {
  name: string;
  parentId?: string | null;
  projectTag?: string | null;
}): Promise<DocFolder> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('doc_folders')
    .insert({ name: params.name, parent_id: params.parentId ?? null, project_tag: params.projectTag ?? null, created_by: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToFolder(data);
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from('doc_folders').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Docs ─────────────────────────────────────────────────────────────────────

export async function listDocs(folderId?: string | null): Promise<Doc[]> {
  const supabase = getClient();
  let query = supabase.from('docs').select('*').order('updated_at', { ascending: false });
  if (folderId === null) {
    query = query.is('folder_id', null);
  } else if (folderId) {
    query = query.eq('folder_id', folderId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToDoc);
}

export async function getDoc(id: string): Promise<Doc> {
  const supabase = getClient();
  const { data, error } = await supabase.from('docs').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return rowToDoc(data);
}

export async function createDoc(params: {
  title: string;
  content?: string;
  folderId?: string | null;
  projectTag?: string | null;
}): Promise<Doc> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('docs')
    .insert({
      title: params.title,
      content: params.content ?? '',
      folder_id: params.folderId ?? null,
      project_tag: params.projectTag ?? null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToDoc(data);
}

export async function updateDoc(id: string, params: { title?: string; content?: string; folderId?: string | null }): Promise<Doc> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id };
  if (params.title !== undefined) updates.title = params.title;
  if (params.content !== undefined) updates.content = params.content;
  if ('folderId' in params) updates.folder_id = params.folderId ?? null;

  const { data, error } = await supabase.from('docs').update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return rowToDoc(data);
}

export async function deleteDoc(id: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from('docs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function listDocFiles(folderId?: string | null): Promise<DocFile[]> {
  const supabase = getClient();
  let query = supabase.from('doc_files').select('*').order('created_at', { ascending: false });
  if (folderId === null) {
    query = query.is('folder_id', null);
  } else if (folderId) {
    query = query.eq('folder_id', folderId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const file = rowToDocFile(row);
    const { data: urlData } = supabase.storage.from('docs').getPublicUrl(row.storage_path);
    file.publicUrl = urlData?.publicUrl ?? undefined;
    return file;
  });
}

export async function uploadDocFile(params: {
  file: File;
  folderId?: string | null;
  projectTag?: string | null;
}): Promise<DocFile> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = params.file.name.split('.').pop() ?? '';
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('docs')
    .upload(storagePath, params.file, { contentType: params.file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('doc_files')
    .insert({
      name: params.file.name,
      storage_path: storagePath,
      mime_type: params.file.type || null,
      size_bytes: params.file.size,
      folder_id: params.folderId ?? null,
      project_tag: params.projectTag ?? null,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const file = rowToDocFile(data);
  const { data: urlData } = supabase.storage.from('docs').getPublicUrl(storagePath);
  file.publicUrl = urlData?.publicUrl ?? undefined;
  return file;
}

export async function deleteDocFile(id: string, storagePath: string): Promise<void> {
  const supabase = getClient();
  await supabase.storage.from('docs').remove([storagePath]);
  const { error } = await supabase.from('doc_files').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

export function buildFolderTree(folders: DocFolder[]): DocFolder[] {
  const map = new Map<string, DocFolder & { children: DocFolder[] }>();
  const roots: DocFolder[] = [];

  for (const f of folders) {
    map.set(f.id, { ...f, children: [] });
  }
  for (const f of folders) {
    if (f.parentId) {
      map.get(f.parentId)?.children?.push(map.get(f.id)!);
    } else {
      roots.push(map.get(f.id)!);
    }
  }
  return roots;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToFolder(row: Record<string, unknown>): DocFolder {
  return {
    id: row.id as string,
    name: row.name as string,
    parentId: (row.parent_id as string | null) ?? null,
    projectTag: (row.project_tag as string | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToDoc(row: Record<string, unknown>): Doc {
  return {
    id: row.id as string,
    title: row.title as string,
    content: (row.content as string) ?? '',
    folderId: (row.folder_id as string | null) ?? null,
    projectTag: (row.project_tag as string | null) ?? null,
    createdBy: row.created_by as string,
    updatedBy: (row.updated_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToDocFile(row: Record<string, unknown>): DocFile {
  return {
    id: row.id as string,
    name: row.name as string,
    storagePath: row.storage_path as string,
    mimeType: (row.mime_type as string | null) ?? null,
    sizeBytes: (row.size_bytes as number | null) ?? null,
    folderId: (row.folder_id as string | null) ?? null,
    projectTag: (row.project_tag as string | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}
