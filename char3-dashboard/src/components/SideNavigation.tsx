'use client';

import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Button } from '@mui/material';
import { 
  Group as GroupIcon, 
  Dashboard as DashboardIcon, 
  Person as PersonIcon, 
  Assessment as AssessmentIcon, 
  Public as PublicIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Team Collab',
    icon: <GroupIcon />,
    path: '/'
  },
  {
    id: 'team-boards',
    label: 'Team Boards',
    icon: <DashboardIcon />,
    path: '/team-boards'
  },
  {
    id: 'account-management',
    label: 'Account Management',
    icon: <PersonIcon />,
    path: '/account-management'
  },
  {
    id: 'project-management',
    label: 'Project Management',
    icon: <AssessmentIcon />,
    path: '/project-management'
  },
  {
    id: 'client-portals',
    label: 'Client Portals',
    icon: <PublicIcon />,
    path: '/client-portals'
  }
];

export function SideNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: '#0f0f0f',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Logo/Brand */}
      <Box sx={{ px: 2.5, py: 2.5, mb: 1 }}>
        <Typography variant="h6" sx={{ color: '#e0e0e0', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
          char<span style={{ color: '#ff6b35' }}>3</span> Hub
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, px: 1.5, py: 0 }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  border: 'none',
                  bgcolor: isActive ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                  color: isActive ? '#ff6b35' : 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(255, 107, 53, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#ff6b35' : 'rgba(255, 255, 255, 0.9)'
                  },
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 36,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.1rem'
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '-0.01em'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info & Sign Out */}
      <Box sx={{ px: 2, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, px: 0.5 }}>
            <Avatar
              sx={{ 
                width: 28, 
                height: 28, 
                bgcolor: '#ff6b35',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontWeight: 600, 
                fontSize: '0.8125rem',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255, 255, 255, 0.5)', 
                fontSize: '0.6875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block'
              }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        )}
        
        <Button
          onClick={signOut}
          startIcon={<LogoutIcon sx={{ fontSize: '1rem' }} />}
          sx={{
            width: '100%',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.8125rem',
            fontWeight: 400,
            justifyContent: 'flex-start',
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            textTransform: 'none',
            letterSpacing: '-0.01em',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.9)',
              bgcolor: 'rgba(255, 255, 255, 0.04)'
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
