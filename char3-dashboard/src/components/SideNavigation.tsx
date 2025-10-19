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
  
  console.log('SideNavigation - User:', user);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        width: 250,
        height: '100vh',
        bgcolor: '#2a2a2a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #444'
      }}
    >
      {/* Logo/Brand */}
      <Box sx={{ p: 2, borderBottom: '1px solid #444' }}>
        <Typography variant="h6" sx={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
          char<span style={{ color: '#ff6b35' }}>3</span> Hub
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, p: 0 }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderLeft: isActive ? '3px solid #ff6b35' : '3px solid transparent',
                  bgcolor: isActive ? '#1a1a1a' : 'transparent',
                  color: isActive ? '#ff6b35' : '#e0e0e0',
                  '&:hover': {
                    bgcolor: '#ff6b35',
                    color: 'white',
                    borderLeft: '3px solid #ff6b35'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.2rem'
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 'bold' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info & Sign Out */}
      <Box sx={{ p: 2, borderTop: '1px solid #444' }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: '#ff6b35' }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: '#e0e0e0', fontWeight: 'bold', fontSize: '0.875rem' }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem' }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        )}
        
        <Button
          onClick={signOut}
          startIcon={<LogoutIcon />}
          sx={{
            width: '100%',
            color: '#888',
            fontSize: '0.875rem',
            justifyContent: 'flex-start',
            '&:hover': {
              color: '#ff6b35',
              bgcolor: 'rgba(255, 107, 53, 0.1)'
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
