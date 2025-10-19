'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, CircularProgress, Link } from '@mui/material';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Redirect to Trello OAuth
      window.location.href = '/api/auth/trello?action=login';
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      height: '100vh',
      bgcolor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3
    }}>
      {/* Logo/Title */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
          char3 Hub
        </Typography>
        <Typography variant="body1" sx={{ color: '#888' }}>
          Sign in with your Trello account to access your workspace
        </Typography>
      </Box>

      {/* Sign In Button */}
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        sx={{
          bgcolor: '#ff6b35',
          color: 'white',
          px: 3,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 'bold',
          borderRadius: 2,
          minWidth: 180,
          textTransform: 'none',
          '&:hover': {
            bgcolor: '#e55a2b'
          },
          '&:disabled': {
            bgcolor: '#666',
            color: '#999'
          }
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} sx={{ color: 'white' }} />
            <Typography>Signing in...</Typography>
          </Box>
        ) : (
          'SIGN IN WITH TRELLO'
        )}
      </Button>

    </Box>
  );
}
