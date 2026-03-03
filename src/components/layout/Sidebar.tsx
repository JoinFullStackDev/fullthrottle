'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import ChatIcon from '@mui/icons-material/ChatOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';

export const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { label: 'Agents', href: '/agents', icon: SmartToyIcon },
  { label: 'Tasks', href: '/tasks', icon: AssignmentIcon },
  { label: 'Conversations', href: '/conversations', icon: ChatIcon },
  { label: 'Admin', href: '/admin', icon: AdminPanelSettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}
        >
          FullThrottle
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
          AI Operations Platform
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive}
              sx={{ mb: 0.5, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                <item.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'text.primary' : 'text.secondary',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
