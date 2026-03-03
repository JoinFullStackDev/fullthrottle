import Box from '@mui/material/Box';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
