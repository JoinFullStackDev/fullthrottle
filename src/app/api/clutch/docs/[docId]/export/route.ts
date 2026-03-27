/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authenticateClutchBearer } from '../../../_lib/auth';

export const maxDuration = 30;

function createSvc(): SupabaseClient<any> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function buildMarkdown(title: string, content: string, folderPath: string, createdAt: string): string {
  const frontMatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${new Date(createdAt).toISOString().split('T')[0]}"`,
    folderPath ? `folder: "${folderPath}"` : null,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  return `${frontMatter}\n\n# ${title}\n\n${content}`;
}

async function resolveFolderPath(folderId: string, svc: SupabaseClient<any>): Promise<string> {
  const parts: string[] = [];
  let currentId: string | null = folderId;
  let depth = 0;

  while (currentId && depth < 10) {
    const { data: row }: { data: Record<string, unknown> | null } = await svc
      .from('doc_folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .single();
    if (!row) break;
    parts.unshift(row.name as string);
    currentId = (row.parent_id as string | null) ?? null;
    depth++;
  }

  return parts.join('/');
}

async function generatePdf(markdownContent: string): Promise<Buffer> {
  // Determine executable path: local override → @sparticuz/chromium-min → error
  let executablePath: string | undefined = process.env.CHROMIUM_EXECUTABLE_PATH;

  if (!executablePath) {
    const chromium = await import('@sparticuz/chromium-min');
    const remoteUrl =
      process.env.CHROMIUM_REMOTE_URL ??
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';
    executablePath = await chromium.default.executablePath(remoteUrl);
  }

  // Lazy-load puppeteer-core and md-to-pdf to keep cold start lean
  const puppeteer = await import('puppeteer-core');
  const { mdToPdf } = await import('md-to-pdf');

  const pdf = await mdToPdf(
    { content: markdownContent },
    {
      launch_options: {
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      },
      pdf_options: { format: 'A4', printBackground: true },
    } as any,
  );

  // Suppress unused import warning (puppeteer-core needed for md-to-pdf runtime)
  void puppeteer;

  if (!pdf?.content) throw new Error('PDF generation failed: empty content');
  return pdf.content as unknown as Buffer;
}

// GET /api/clutch/docs/:docId/export?format=md|pdf
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const user = await authenticateClutchBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { docId } = await params;
  const format = new URL(req.url).searchParams.get('format') ?? 'md';

  if (format !== 'md' && format !== 'pdf') {
    return NextResponse.json({ error: 'format must be md or pdf' }, { status: 400 });
  }

  const svc = createSvc();
  const { data: doc, error } = await svc.from('docs').select('*').eq('id', docId).single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const row = doc as Record<string, unknown>;
  const title = row.title as string;
  const content = (row.content as string) ?? '';
  const folderId = (row.folder_id as string | null) ?? null;
  const createdAt = row.created_at as string;

  const folderPath = folderId ? await resolveFolderPath(folderId, svc) : '';
  const markdown = buildMarkdown(title, content, folderPath, createdAt);
  const safeTitle = title.replace(/[^a-z0-9_\-\s]/gi, '').trim().replace(/\s+/g, '-') || 'document';

  if (format === 'md') {
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeTitle}.md"`,
      },
    });
  }

  // PDF
  try {
    const pdfBuffer = await generatePdf(markdown);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[export/pdf] Error:', err);
    return NextResponse.json(
      { error: 'PDF generation failed. Ensure CHROMIUM_EXECUTABLE_PATH or CHROMIUM_REMOTE_URL is configured.' },
      { status: 500 },
    );
  }
}
