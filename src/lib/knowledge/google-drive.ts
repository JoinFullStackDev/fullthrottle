import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import type { OAuthCredentials } from './types';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  isFolder: boolean;
}

export interface DriveRoot {
  id: string;
  name: string;
  kind: 'shared_drive' | 'my_drive';
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface DriveFileMetadata {
  modifiedTime: string;
  size: string;
}

function getAuthClient(credentials: OAuthCredentials) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: credentials.refreshToken });
  return oauth2;
}

function getDriveClient(credentials: OAuthCredentials): drive_v3.Drive {
  const auth = getAuthClient(credentials);
  return google.drive({ version: 'v3', auth });
}

const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
const GOOGLE_SLIDES_MIME = 'application/vnd.google-apps.presentation';
const SUPPORTED_TEXT_MIMES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'application/json',
  'text/x-yaml',
];

export async function listDriveRoots(
  credentials: OAuthCredentials,
): Promise<DriveRoot[]> {
  const drive = getDriveClient(credentials);
  const roots: DriveRoot[] = [];

  roots.push({ id: 'root', name: 'My Drive', kind: 'my_drive' });

  try {
    let pageToken: string | undefined;
    do {
      const res = await drive.drives.list({
        pageSize: 50,
        pageToken,
        fields: 'nextPageToken, drives(id, name)',
      });

      for (const d of res.data.drives ?? []) {
        if (d.id && d.name) {
          roots.push({ id: d.id, name: d.name, kind: 'shared_drive' });
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  } catch {
    // Shared drives may not be available
  }

  return roots;
}

export async function listDriveFiles(
  credentials: OAuthCredentials,
  folderId: string,
): Promise<DriveFile[]> {
  const drive = getDriveClient(credentials);

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of res.data.files ?? []) {
      if (file.id && file.name && file.mimeType) {
        files.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime ?? '',
          size: file.size ?? undefined,
          isFolder: file.mimeType === FOLDER_MIME,
        });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  // Folders first, then files alphabetically
  return files.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function checkFileModified(
  credentials: OAuthCredentials,
  fileId: string,
): Promise<DriveFileMetadata> {
  const drive = getDriveClient(credentials);

  const res = await drive.files.get({
    fileId,
    fields: 'modifiedTime, size',
    supportsAllDrives: true,
  });

  return {
    modifiedTime: res.data.modifiedTime ?? '',
    size: res.data.size ?? '0',
  };
}

export async function fetchFileContent(
  credentials: OAuthCredentials,
  fileId: string,
  mimeType: string,
): Promise<string | null> {
  const drive = getDriveClient(credentials);

  if (mimeType === GOOGLE_DOC_MIME) {
    const res = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' },
    );
    return typeof res.data === 'string' ? res.data : String(res.data);
  }

  if (mimeType === GOOGLE_SHEET_MIME) {
    const res = await drive.files.export(
      { fileId, mimeType: 'text/csv' },
      { responseType: 'text' },
    );
    return typeof res.data === 'string' ? res.data : String(res.data);
  }

  if (mimeType === GOOGLE_SLIDES_MIME) {
    const res = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' },
    );
    return typeof res.data === 'string' ? res.data : String(res.data);
  }

  if (SUPPORTED_TEXT_MIMES.includes(mimeType) || mimeType.startsWith('text/')) {
    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'text' },
    );
    return typeof res.data === 'string' ? res.data : String(res.data);
  }

  return null;
}

export function isSupported(mimeType: string): boolean {
  return (
    mimeType === GOOGLE_DOC_MIME ||
    mimeType === GOOGLE_SHEET_MIME ||
    mimeType === GOOGLE_SLIDES_MIME ||
    SUPPORTED_TEXT_MIMES.includes(mimeType) ||
    mimeType.startsWith('text/')
  );
}
