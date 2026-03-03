'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface UsageStatBlockProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
}

export default function UsageStatBlock({ label, value, sublabel, icon }: UsageStatBlockProps) {
  return (
    <Card sx={{ flex: '1 1 0', minWidth: 180 }}>
      <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h2" color="text.primary">
              {value}
            </Typography>
            <Typography variant="caption">{label}</Typography>
            {sublabel && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                {sublabel}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
