'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

export default function AccountManagement() {
  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: '#1a1a1a', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 4
    }}>
      <Typography variant="h3" sx={{ color: '#e0e0e0', fontWeight: 'bold', mb: 4 }}>
        Account Management
      </Typography>
      <Typography variant="h6" sx={{ color: '#888', textAlign: 'center' }}>
        Client deliverables and account management tools will be displayed here
      </Typography>
    </Box>
  );
}

