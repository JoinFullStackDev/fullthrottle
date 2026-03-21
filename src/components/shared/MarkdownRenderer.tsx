'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { Components } from 'react-markdown';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <Typography variant="h3" sx={{ mt: 2, mb: 1 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="h3" sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="body1" fontWeight={600} sx={{ mt: 1.5, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h4: ({ children }) => (
    <Typography variant="body2" fontWeight={600} sx={{ mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h5: ({ children }) => (
    <Typography variant="body2" fontWeight={600} sx={{ mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h6: ({ children }) => (
    <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1, '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }) => (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ color: 'primary.light', textDecorationColor: 'primary.dark' }}
    >
      {children}
    </Link>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ pl: 2.5, my: 0.5, '& li': { mb: 0.25 } }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 2.5, my: 0.5, '& li': { mb: 0.25 } }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
      {children}
    </Typography>
  ),
  blockquote: ({ children }) => (
    <Box
      sx={{
        borderLeft: 3,
        borderColor: 'primary.dark',
        pl: 2,
        my: 1,
        color: 'text.secondary',
      }}
    >
      {children}
    </Box>
  ),
  hr: () => <Divider sx={{ my: 2 }} />,
  table: ({ children }) => (
    <TableContainer sx={{ my: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small">{children}</Table>
    </TableContainer>
  ),
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => (
    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: 'divider' }}>
      {children}
    </TableCell>
  ),
  td: ({ children }) => (
    <TableCell sx={{ fontSize: '0.8rem', borderColor: 'divider' }}>{children}</TableCell>
  ),
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (match) {
      return <CodeBlock language={match[1]} code={codeString} />;
    }

    return (
      <Box
        component="code"
        sx={{
          bgcolor: 'background.default',
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: '0.8em',
          fontFamily: '"Fira Code", "Fira Mono", Menlo, Consolas, monospace',
          border: 1,
          borderColor: 'divider',
        }}
      >
        {children}
      </Box>
    );
  },
  pre: ({ children }) => <>{children}</>,
  strong: ({ children }) => (
    <Box component="strong" sx={{ fontWeight: 600, color: 'text.primary' }}>
      {children}
    </Box>
  ),
  em: ({ children }) => (
    <Box component="em" sx={{ fontStyle: 'italic' }}>
      {children}
    </Box>
  ),
};

const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <Box sx={{ '& > *:first-of-type': { mt: 0 } }}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
    </Box>
  );
});

export default MarkdownRenderer;
