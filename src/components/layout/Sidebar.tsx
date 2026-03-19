'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToyOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import ChatIcon from '@mui/icons-material/ChatOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/permissions';
import type { Action } from '@/lib/permissions';
import type { SvgIconComponent } from '@mui/icons-material';

export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 68;

interface NavItem {
  label: string;
  href: string;
  icon: SvgIconComponent;
  requiredAction?: Action;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { label: 'Agents', href: '/agents', icon: SmartToyIcon },
  { label: 'Tasks', href: '/tasks', icon: AssignmentIcon },
  { label: 'Conversations', href: '/conversations', icon: ChatIcon },
  { label: 'Knowledge', href: '/knowledge', icon: MenuBookIcon },
  { label: 'Docs', href: '/docs', icon: FolderIcon },
  { label: 'Integrations', href: '/integrations', icon: IntegrationInstructionsIcon, requiredAction: 'admin_access' },
  { label: 'Admin', href: '/admin', icon: AdminPanelSettingsIcon, requiredAction: 'admin_access' },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredAction) return true;
    return can(user?.role, item.requiredAction);
  });

  return (
    <Box
      component="nav"
      sx={{
        width,
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
        transition: 'width 200ms ease-in-out',
      }}
    >
      <Box
        sx={{
          px: collapsed ? 0 : 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
        }}
      >
        {collapsed ? (
          <Image
            src="/assets/fsicon.svg"
            alt="FullStack"
            width={36}
            height={37}
            priority
          />
        ) : (
          <Box>
            <Image
              src="/assets/fullstacklogo.svg"
              alt="FullStack"
              width={160}
              height={25}
              priority
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              AI Operations Platform
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <List sx={{ px: collapsed ? 0.75 : 1.5, py: 1.5, flex: 1 }}>
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const button = (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive}
              sx={{
                mb: 0.5,
                py: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'unset' : 36,
                  color: isActive ? 'primary.main' : 'text.secondary',
                }}
              >
                <item.icon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'text.primary' : 'text.secondary',
                  }}
                />
              )}
            </ListItemButton>
          );
          return collapsed ? (
            <Tooltip key={item.href} title={item.label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
      <Divider />
      {user && (
        <Tooltip title={collapsed ? user.name : ''} placement="right" arrow disableHoverListener={!collapsed}>
          <Box
            component={Link}
            href="/profile"
            sx={{
              px: collapsed ? 0 : 2,
              py: 1.5,
              mx: collapsed ? 0 : 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 1.5,
              textDecoration: 'none',
              color: 'inherit',
              borderRadius: 1,
              bgcolor: pathname === '/profile' ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Avatar
              src={user.avatarUrl ?? undefined}
              sx={{ width: 28, height: 28, bgcolor: 'action.selected', fontSize: '0.8rem' }}
            >
              <PersonIcon sx={{ fontSize: 16 }} />
            </Avatar>
            {!collapsed && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {user.role.replace(/_/g, ' ')}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>
      )}
      <List sx={{ px: collapsed ? 0.75 : 1.5, py: 1 }}>
        <Tooltip title={collapsed ? 'Sign Out' : ''} placement="right" arrow disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={handleSignOut}
            sx={{ py: 1, justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 1 : 2 }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 'unset' : 36, color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Sign Out"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </List>
    </Box>
  );
}
