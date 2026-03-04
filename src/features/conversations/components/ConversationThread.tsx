'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import type { ConversationMessage } from '@/lib/types';
import { SenderType } from '@/lib/constants';
import type { DocumentCitation } from '../types';
import StreamingMessage from './StreamingMessage';
import MarkdownRenderer from './MarkdownRenderer';
import MessageHeader from './MessageHeader';
import DocumentCitationCard from './DocumentCitationCard';
import InlineDocumentViewer from './InlineDocumentViewer';

interface ConversationThreadProps {
  messages: ConversationMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  agentName?: string;
  agentAvatarUrl?: string;
  agentAvatarMap?: Record<string, string>;
  currentStreamingAgent?: { id: string; name: string } | null;
}

export default function ConversationThread({
  messages,
  streamingContent,
  isStreaming,
  agentName,
  agentAvatarUrl,
  agentAvatarMap,
  currentStreamingAgent,
}: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [openViewer, setOpenViewer] = useState<{
    messageId: string;
    documentName: string;
  } | null>(null);

  const handleToggleViewer = useCallback((messageId: string, documentName: string) => {
    setOpenViewer((prev) =>
      prev?.messageId === messageId && prev?.documentName === documentName
        ? null
        : { messageId, documentName },
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {messages.map((msg) => {
        const isAgent = msg.senderType === SenderType.AGENT;
        const direction = isAgent ? 'row' : 'row-reverse';
        const citations: DocumentCitation[] =
          (msg.metadata?.knowledgeSources as DocumentCitation[] | undefined) ?? [];

        return (
          <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <MessageHeader
              senderType={msg.senderType}
              senderName={msg.senderName}
              avatarUrl={msg.senderAvatarUrl}
              agentAvatarUrl={
                isAgent
                  ? (agentAvatarUrl ?? (msg.senderName ? agentAvatarMap?.[msg.senderName] : undefined))
                  : undefined
              }
              agentName={agentName}
              timestamp={msg.createdAt}
              direction={direction}
            />
            <Box
              sx={{
                maxWidth: '70%',
                bgcolor: isAgent ? 'background.paper' : 'action.selected',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.5,
                alignSelf: isAgent ? 'flex-start' : 'flex-end',
                ml: isAgent ? 5 : 0,
                mr: isAgent ? 0 : 5,
              }}
            >
              <MarkdownRenderer content={msg.content} />
            </Box>
            {isAgent && citations.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  maxWidth: '70%',
                  ml: 5,
                }}
              >
                {citations.map((c) => (
                  <DocumentCitationCard
                    key={c.name}
                    citation={c}
                    isActive={
                      openViewer?.messageId === msg.id &&
                      openViewer?.documentName === c.name
                    }
                    onToggle={() => handleToggleViewer(msg.id, c.name)}
                  />
                ))}
              </Box>
            )}
            {openViewer?.messageId === msg.id && (
              <InlineDocumentViewer
                documentName={openViewer.documentName}
                onClose={() => setOpenViewer(null)}
              />
            )}
          </Box>
        );
      })}

      {isStreaming && streamingContent !== undefined && (
        <StreamingMessage
          content={streamingContent}
          agentName={currentStreamingAgent?.name ?? agentName}
        />
      )}

      <div ref={bottomRef} />
    </Box>
  );
}
