import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: 'text.disabled', mb: 2 }}>
        {icon ?? <InboxIcon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography variant="h3" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 400, mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
