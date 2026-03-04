'use client';

import { useState, useCallback, useRef } from 'react';

interface StreamChunk {
  type: 'meta' | 'text' | 'done' | 'error' | 'agentStart' | 'agentDone';
  content?: string;
  conversationId?: string;
  agentId?: string;
  agentName?: string;
}

export interface CurrentAgent {
  id: string;
  name: string;
}

interface UseRoundTableStreamReturn {
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  currentAgent: CurrentAgent | null;
  send: (params: { agentIds: string[]; conversationId?: string; message: string; documentIds?: string[] }) => void;
  reset: () => void;
}

export function useRoundTableStream(): UseRoundTableStreamReturn {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<CurrentAgent | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStreamingContent('');
    setIsStreaming(false);
    setError(null);
    setCurrentAgent(null);
  }, []);

  const send = useCallback(
    (params: { agentIds: string[]; conversationId?: string; message: string; documentIds?: string[] }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreamingContent('');
      setIsStreaming(true);
      setError(null);
      setCurrentAgent(null);

      (async () => {
        try {
          const res = await fetch('/api/chat/roundtable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentIds: params.agentIds,
              conversationId: params.conversationId,
              message: params.message,
              documentIds: params.documentIds,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error ?? `HTTP ${res.status}`);
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error('No response stream');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') continue;

              try {
                const chunk: StreamChunk = JSON.parse(payload);

                if (chunk.type === 'meta' && chunk.conversationId) {
                  setConversationId(chunk.conversationId);
                } else if (chunk.type === 'agentStart' && chunk.agentId && chunk.agentName) {
                  setCurrentAgent({ id: chunk.agentId, name: chunk.agentName });
                  setStreamingContent('');
                } else if (chunk.type === 'text' && chunk.content) {
                  setStreamingContent((prev) => prev + chunk.content);
                } else if (chunk.type === 'agentDone') {
                  setStreamingContent('');
                } else if (chunk.type === 'error') {
                  setError(chunk.content ?? 'Stream error');
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            setError(err.message);
          }
        } finally {
          setIsStreaming(false);
          setCurrentAgent(null);
        }
      })();
    },
    [],
  );

  return { streamingContent, isStreaming, error, conversationId, currentAgent, send, reset };
}
