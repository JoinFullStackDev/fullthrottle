'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckIcon from '@mui/icons-material/CheckOutlined';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import yaml from 'react-syntax-highlighter/dist/cjs/languages/prism/yaml';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);

interface CodeBlockProps {
  language?: string;
  code: string;
}

const CUSTOM_STYLE: React.CSSProperties = {
  margin: 0,
  padding: '16px',
  fontSize: '0.8rem',
  lineHeight: 1.6,
  borderRadius: '6px',
  background: '#1A1A22',
};

export default function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <Box sx={{ position: 'relative', my: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.5,
          bgcolor: '#15151D',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
          {language || 'code'}
        </Typography>
        <Tooltip title={copied ? 'Copied' : 'Copy'}>
          <IconButton size="small" onClick={handleCopy} sx={{ p: 0.5 }}>
            {copied ? (
              <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
            ) : (
              <ContentCopyIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          customStyle={{
            ...CUSTOM_STYLE,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        >
          {code}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
}
