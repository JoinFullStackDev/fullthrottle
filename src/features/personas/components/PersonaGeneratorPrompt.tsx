'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface PersonaGeneratorPromptProps {
  agentId: string;
  onGenerated: () => void;
}

export default function PersonaGeneratorPrompt({ agentId, onGenerated }: PersonaGeneratorPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe the persona you want to generate.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/agents/${agentId}/generate-persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate persona');
      }

      onGenerated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        No persona overrides configured. Describe what this agent should do and AI will generate a full persona configuration that you can then edit.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TextField
            label="Persona Prompt"
            placeholder="Describe the agent's behavior, constraints, skills, and responsibilities..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={4}
            fullWidth
            disabled={generating}
            sx={{ mb: 2 }}
          />

          {generating ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Generating persona configuration...
              </Typography>
            </Box>
          ) : (
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              onClick={handleGenerate}
              disabled={!prompt.trim()}
            >
              Generate Persona
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
