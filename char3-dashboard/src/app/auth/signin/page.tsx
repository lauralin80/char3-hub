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
      bgcolor: '#0d0d0d',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pt: '20vh',
      px: 3
    }}>
      {/* Logo/Title */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: '#ff6b35', 
            fontWeight: 600, 
            fontSize: '2.5rem',
            letterSpacing: '-0.03em',
            mb: 2
          }}
        >
          char3 Hub
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '0.9375rem',
            fontWeight: 400,
            letterSpacing: '-0.01em'
          }}
        >
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
          px: 4,
          py: 1.5,
          fontSize: '0.875rem',
          fontWeight: 600,
          borderRadius: 1.5,
          minWidth: 200,
          textTransform: 'none',
          letterSpacing: '-0.01em',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          '&:hover': {
            bgcolor: '#e55a2b',
            boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
          },
          '&:disabled': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.4)'
          },
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={18} sx={{ color: 'white' }} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Signing in...</Typography>
          </Box>
        ) : (
          'Sign in with Trello'
        )}
      </Button>

    </Box>
  );
}
