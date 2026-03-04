'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Popper from '@mui/material/Popper';
import SendIcon from '@mui/icons-material/SendOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import type { KnowledgeSource } from '@/lib/types';

export interface ChatSendPayload {
  message: string;
  documentIds?: string[];
}

interface ChatInputProps {
  onSend: (payload: ChatSendPayload) => void;
  disabled?: boolean;
  placeholder?: string;
  knowledgeSources?: KnowledgeSource[];
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder,
  knowledgeSources = [],
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<KnowledgeSource[]>([]);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const filteredSources = useMemo(() => {
    if (slashQuery === null) return [];
    const q = slashQuery.toLowerCase();
    const attachedIds = new Set(attachedDocs.map((d) => d.id));
    return knowledgeSources
      .filter((s) => !attachedIds.has(s.id))
      .filter((s) => s.name.toLowerCase().includes(q) || s.sourceType.toLowerCase().includes(q));
  }, [slashQuery, knowledgeSources, attachedDocs]);

  const showPopover = slashQuery !== null && filteredSources.length > 0;

  const attachDocument = useCallback(
    (source: KnowledgeSource) => {
      setAttachedDocs((prev) => {
        if (prev.some((d) => d.id === source.id)) return prev;
        return [...prev, source];
      });
      setValue((prev) => {
        const slashIdx = prev.lastIndexOf('/');
        if (slashIdx === -1) return prev;
        return prev.slice(0, slashIdx).trimEnd();
      });
      setSlashQuery(null);
      setHighlightIndex(0);
    },
    [],
  );

  const removeDocument = useCallback((id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend({
      message: trimmed,
      documentIds: attachedDocs.length > 0 ? attachedDocs.map((d) => d.id) : undefined,
    });
    setValue('');
    setAttachedDocs([]);
    setSlashQuery(null);
  }, [value, disabled, onSend, attachedDocs]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (knowledgeSources.length === 0) return;

      const cursorPos = e.target.selectionStart ?? newValue.length;
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const slashIdx = textBeforeCursor.lastIndexOf('/');

      if (slashIdx !== -1) {
        const beforeSlash = slashIdx > 0 ? textBeforeCursor[slashIdx - 1] : ' ';
        if (beforeSlash === ' ' || beforeSlash === '\n' || slashIdx === 0) {
          const query = textBeforeCursor.slice(slashIdx + 1);
          if (!query.includes('\n') && !query.includes(' ')) {
            setSlashQuery(query);
            setHighlightIndex(0);
            return;
          }
        }
      }
      setSlashQuery(null);
    },
    [knowledgeSources],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showPopover) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightIndex((prev) => Math.min(prev + 1, filteredSources.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (filteredSources[highlightIndex]) {
            attachDocument(filteredSources[highlightIndex]);
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSlashQuery(null);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [showPopover, filteredSources, highlightIndex, attachDocument, handleSend],
  );

  return (
    <Box
      ref={anchorRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      {attachedDocs.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', px: 2, pt: 1.5, pb: 0 }}>
          {attachedDocs.map((doc) => (
            <Chip
              key={doc.id}
              icon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
              label={doc.name}
              size="small"
              onDelete={() => removeDocument(doc.id)}
              variant="outlined"
              sx={{ height: 26, fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', p: 2 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type a message... (/ to reference documents)'}
          disabled={disabled}
          inputRef={inputRef}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          color="primary"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
            width: 40,
            height: 40,
          }}
        >
          {disabled ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SendIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      <Popper
        open={showPopover}
        anchorEl={anchorRef.current}
        placement="top-start"
        sx={{ zIndex: 1300, width: anchorRef.current?.offsetWidth ?? 400 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
      >
        <Paper
          elevation={8}
          sx={{
            maxHeight: 240,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
            <Typography variant="caption" color="text.disabled">
              Reference a document
            </Typography>
          </Box>
          <List dense disablePadding>
            {filteredSources.map((source, idx) => (
              <ListItemButton
                key={source.id}
                selected={idx === highlightIndex}
                onClick={() => attachDocument(source)}
                sx={{ py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap>
                      {source.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.disabled" noWrap>
                      {source.sourceType}
                      {source.agentName ? ` · ${source.agentName}` : ''}
                      {source.projectTag ? ` · ${source.projectTag}` : ''}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
}
