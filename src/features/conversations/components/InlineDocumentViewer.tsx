'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/CloseOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { getDocumentContent } from '../service';
import MarkdownRenderer from './MarkdownRenderer';

interface InlineDocumentViewerProps {
  documentName: string;
  onClose: () => void;
}

function isMarkdownMime(mimeType: string | null): boolean {
  if (!mimeType) return true;
  return (
    mimeType.includes('markdown') ||
    mimeType.includes('text/plain') ||
    mimeType === 'text/html'
  );
}

function isPdfMime(mimeType: string | null): boolean {
  return mimeType === 'application/pdf';
}

export default function InlineDocumentViewer({
  documentName,
  onClose,
}: InlineDocumentViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDocumentContent(documentName)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError('Document content not available.');
          setContent(null);
        } else {
          setContent(result.content);
          setMimeType(result.mimeType);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load document.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentName]);

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        maxHeight: 400,
        overflow: 'auto',
        mt: 0.5,
        ml: 5,
        maxWidth: '70%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.default',
          zIndex: 1,
        }}
      >
        <Typography variant="caption" fontWeight={600} noWrap>
          {documentName}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="rectangular" height={60} />
          </Box>
        )}

        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}

        {!loading && !error && content !== null && (
          <>
            {isPdfMime(mimeType) ? (
              content.startsWith('http') ? (
                <Box
                  component="iframe"
                  src={content}
                  sx={{
                    width: '100%',
                    height: 360,
                    border: 'none',
                    borderRadius: 1,
                    bgcolor: '#fff',
                  }}
                  title={documentName}
                />
              ) : (
                <Box>
                  <Chip
                    icon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                    label="Extracted from PDF"
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1.5, height: 22, fontSize: '0.65rem' }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
                  >
                    {content}
                  </Typography>
                </Box>
              )
            ) : isMarkdownMime(mimeType) ? (
              <MarkdownRenderer content={content} />
            ) : (
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}
              >
                {content}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
