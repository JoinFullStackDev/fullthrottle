import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card sx={{ flex: '1 1 0', minWidth: 180 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h2" color="text.primary">
            {value}
          </Typography>
          <Typography variant="caption">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
