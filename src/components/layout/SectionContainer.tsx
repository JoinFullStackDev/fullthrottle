import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SectionContainerProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function SectionContainer({ title, actions, children }: SectionContainerProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {(title || actions) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {title && (
            <Typography variant="h2" color="text.primary">
              {title}
            </Typography>
          )}
          {actions && <Box>{actions}</Box>}
        </Box>
      )}
      {children}
    </Box>
  );
}
