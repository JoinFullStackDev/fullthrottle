export interface ResolvedDocument {
  name: string;
  sourceType: string;
  content: string;
  lastVerified: string;
  status: 'fresh' | 'stale' | 'error';
  charCount: number;
}

export interface OAuthCredentials {
  refreshToken: string;
  accessToken?: string | null;
  tokenExpiry?: string | null;
}
