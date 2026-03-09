import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createAuditEntry } from '@/features/audit/service-server';

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.yaml', '.yml']);
const ACCEPTED_EXTENSIONS = new Set([...TEXT_EXTENSIONS, '.pdf']);

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

async function extractText(file: File): Promise<string> {
  const ext = getExtension(file.name);

  if (TEXT_EXTENSIONS.has(ext)) {
    return await file.text();
  }

  if (ext === '.pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdfParse(buffer);
    return result.text;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = (formData.get('name') as string) || '';
  const folderTag = (formData.get('folderTag') as string) || null;
  const projectTag = (formData.get('projectTag') as string) || null;
  const agentId = (formData.get('agentId') as string) || null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!projectTag) {
    return NextResponse.json({ error: 'projectTag is required' }, { status: 400 });
  }

  const ext = getExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Accepted: ${[...ACCEPTED_EXTENSIONS].join(', ')}` },
      { status: 400 },
    );
  }

  const sourceName = name.trim() || file.name;

  let content: string;
  try {
    content = await extractText(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract text';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!content.trim()) {
    return NextResponse.json({ error: 'No text content could be extracted from the file' }, { status: 400 });
  }

  const svc = createServiceRoleClient();

  const { data: source, error: srcError } = await svc
    .from('knowledge_sources')
    .insert({
      name: sourceName,
      type: ext.replace('.', '').toUpperCase(),
      path: file.name,
      source_type: 'upload',
      agent_id: agentId,
      folder_tag: folderTag,
      project_tag: projectTag,
      fetch_status: 'fresh',
      last_fetched_at: new Date().toISOString(),
      mime_type: file.type || `text/${ext.replace('.', '')}`,
    } as never)
    .select('*, agents(name)')
    .single();

  if (srcError || !source) {
    return NextResponse.json({ error: srcError?.message ?? 'Failed to create source' }, { status: 500 });
  }

  const sourceId = (source as { id: string }).id;

  const { error: contentError } = await svc.from('knowledge_content').insert({
    source_id: sourceId,
    content,
    chunk_index: 0,
    char_count: content.length,
  });

  if (contentError) {
    await svc.from('knowledge_sources').delete().eq('id', sourceId);
    return NextResponse.json({ error: contentError.message }, { status: 500 });
  }

  await createAuditEntry(svc, {
    actorId: user.id,
    actionType: 'knowledge_source_uploaded',
    entityType: 'KnowledgeSource',
    entityId: sourceId,
    afterState: { name: sourceName, type: ext, charCount: content.length, folderTag, projectTag, agentId },
    reason: `Uploaded file: ${file.name}`,
  });

  // Auto-update agent's persona override knowledge scope with the project/folder tags
  if (agentId && (projectTag || folderTag)) {
    const { data: overrides } = await svc
      .from('persona_overrides')
      .select('id, knowledge_scope')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (overrides?.length) {
      const override = overrides[0];
      const scope = (override.knowledge_scope ?? {}) as Record<string, unknown>;
      const currentFolders = (scope.allowedFolders as string[]) ?? [];
      const currentProjects = (scope.allowedProjects as string[]) ?? [];
      let changed = false;

      if (folderTag && !currentFolders.includes(folderTag)) {
        currentFolders.push(folderTag);
        changed = true;
      }
      if (projectTag && !currentProjects.includes(projectTag)) {
        currentProjects.push(projectTag);
        changed = true;
      }

      if (changed) {
        await svc
          .from('persona_overrides')
          .update({
            knowledge_scope: { ...scope, allowedFolders: currentFolders, allowedProjects: currentProjects },
          } as never)
          .eq('id', override.id);
      }
    }
  }

  return NextResponse.json({ source });
}
