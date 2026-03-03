'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper sx={{ p: 5, width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            FullThrottle AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Internal Operations Platform
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoComplete="email"
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 1 }}
          >
            Sign In
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          Auth will be connected to Supabase in Phase D
        </Typography>
      </Paper>
    </Box>
  );
}
