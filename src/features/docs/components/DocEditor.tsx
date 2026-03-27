'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import LinkIcon from '@mui/icons-material/Link';
import type { Doc } from '@/lib/types';
import { updateDoc } from '../service';
import ExportMenu from './ExportMenu';

// Lazy-load the markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface DocEditorProps {
  doc: Doc;
  onSaved: (updated: Doc) => void;
}

export default function DocEditor({ doc, onSaved }: DocEditorProps) {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/docs?docId=${doc.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
    linkCopiedTimerRef.current = setTimeout(() => setLinkCopied(false), 2000);
  };

  // Reset when doc changes
  useEffect(() => {
    setTitle(doc.title);
    setContent(doc.content);
    setDirty(false);
  }, [doc.id, doc.title, doc.content]);

  const handleSave = useCallback(async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const updated = await updateDoc(doc.id, { title, content });
      setDirty(false);
      setLastSaved(new Date());
      onSaved(updated);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [doc.id, title, content, dirty, onSaved]);

  // Auto-save after 2s of inactivity
  const scheduleAutoSave = useCallback(() => {
    setDirty(true);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  }, [handleSave]);

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          value={title}
          onChange={(e) => { setTitle(e.target.value); scheduleAutoSave(); }}
          variant="standard"
          placeholder="Document title"
          InputProps={{ disableUnderline: false, sx: { fontSize: '1.1rem', fontWeight: 600 } }}
          sx={{ flex: 1 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastSaved && !dirty && (
            <Typography variant="caption" color="text.disabled">
              Saved {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
          {dirty && !saving && (
            <Typography variant="caption" color="text.disabled">Unsaved</Typography>
          )}
          <Tooltip title={linkCopied ? 'Copied!' : 'Copy link'}>
            <IconButton size="small" onClick={handleCopyLink}>
              <LinkIcon sx={{ fontSize: 18, color: linkCopied ? 'success.main' : 'inherit' }} />
            </IconButton>
          </Tooltip>
          <ExportMenu docId={doc.id} title={title} content={content} />
          <Button
            size="small"
            variant="contained"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            Save
          </Button>
        </Box>
      </Box>

      {/* Editor */}
      <Box
        sx={{ flex: 1, overflow: 'hidden', '& .w-md-editor': { height: '100% !important', bgcolor: 'transparent' }, '& .w-md-editor-text': { color: 'text.primary' } }}
        data-color-mode="dark"
      >
        <MDEditor
          value={content}
          onChange={(val) => { setContent(val ?? ''); scheduleAutoSave(); }}
          height="100%"
          preview="live"
          hideToolbar={false}
        />
      </Box>
    </Box>
  );
}
