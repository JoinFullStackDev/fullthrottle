'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { listAgentContext, bulkSaveAgentContext } from '@/features/agents/contextService';

interface ContextEntry {
  key: string;
  value: string;
}

interface AgentContextTabProps {
  agentId: string;
}

export default function AgentContextTab({ agentId }: AgentContextTabProps) {
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAgentContext(agentId);
      setEntries(data.map((d) => ({ key: d.key, value: d.value })));
      setDirty(false);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateEntry = (index: number, field: 'key' | 'value', val: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    setDirty(true);
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { key: '', value: '' }]);
    setDirty(true);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const validate = (): string | null => {
    const keys = entries.map((e) => e.key.trim());
    for (let i = 0; i < keys.length; i++) {
      if (!keys[i]) return `Row ${i + 1}: key cannot be empty.`;
    }
    const seen = new Set<string>();
    for (const k of keys) {
      if (seen.has(k)) return `Duplicate key: "${k}"`;
      seen.add(k);
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setFeedback({ type: 'error', message: err });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await bulkSaveAgentContext(
        agentId,
        entries.map((e) => ({ key: e.key.trim(), value: e.value })),
      );
      setFeedback({ type: 'success', message: 'Context saved.' });
      setDirty(false);
    } catch (e) {
      setFeedback({ type: 'error', message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {entries.length === 0 && !dirty && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No context entries. Add key-value pairs to provide additional context to this agent.
        </Typography>
      )}

      {entries.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {entries.map((entry, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Key"
                    value={entry.key}
                    onChange={(e) => updateEntry(idx, 'key', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    placeholder="Value"
                    value={entry.value}
                    onChange={(e) => updateEntry(idx, 'value', e.target.value)}
                    sx={{ flex: 2 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeEntry(idx)}
                    color="error"
                    aria-label="Remove entry"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={addEntry}
        >
          Add
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={saving || !dirty}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}
