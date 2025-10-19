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
      gap: 4
    }}>
      {/* Logo/Title */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
          char3 Hub
        </Typography>
        <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 1 }}>
          Team Collaboration Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
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
          py: 2,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          borderRadius: 2,
          minWidth: 200,
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
          'Sign in with Trello'
        )}
      </Button>


      {/* Info */}
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mb: 2 }}>
          You'll be redirected to Trello to authorize access to your boards and cards.
          Only members of the Char3 workspace will be able to access this dashboard.
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8rem' }}>
          Having trouble?{' '}
          <Link 
            href="/auth/token" 
            sx={{ color: '#ff6b35', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Try manual token authentication
          </Link>
        </Typography>
      </Box>

    </Box>
  );
}
