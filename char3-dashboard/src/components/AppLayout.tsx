'use client';

import React from 'react';
import { Box } from '@mui/material';
import { SideNavigation } from './SideNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#1a1a1a' }}>
      <SideNavigation />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
}

