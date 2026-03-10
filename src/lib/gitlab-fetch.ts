import { execFile } from 'node:child_process';

/**
 * Cloudflare blocks Node.js fetch to gitlab.com based on TLS fingerprint (JA3).
 * Using curl as the HTTP client bypasses this since curl has a trusted fingerprint.
 */

interface GitLabFetchResult {
  status: number;
  body: string;
}

export async function gitlabFetch(
  url: string,
  token: string,
): Promise<GitLabFetchResult> {
  return new Promise((resolve, reject) => {
    execFile(
      'curl',
      [
        '-s',
        '-w', '\n__HTTP_STATUS__%{http_code}',
        '-H', `PRIVATE-TOKEN: ${token}`,
        '-H', 'Accept: application/json',
        url,
      ],
      { timeout: 15_000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`curl failed: ${stderr || error.message}`));
          return;
        }

        const marker = '\n__HTTP_STATUS__';
        const idx = stdout.lastIndexOf(marker);
        if (idx === -1) {
          reject(new Error('Unexpected curl output format'));
          return;
        }

        const body = stdout.slice(0, idx);
        const status = parseInt(stdout.slice(idx + marker.length).trim(), 10);

        resolve({ status, body });
      },
    );
  });
}

export function parseJsonBody<T>(raw: string): T {
  return JSON.parse(raw) as T;
}
