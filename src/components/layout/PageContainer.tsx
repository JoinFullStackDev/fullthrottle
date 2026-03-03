import Box from '@mui/material/Box';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: number | string;
}

export default function PageContainer({ children, maxWidth = 1400 }: PageContainerProps) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        mx: 'auto',
        px: 4,
        py: 3,
      }}
    >
      {children}
    </Box>
  );
}
