'use client';

import { useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';

export default function AuthError() {
  const router = useRouter();

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
      <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
        Authentication Error
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#e0e0e0', textAlign: 'center', maxWidth: 400 }}>
        There was an error signing you in. This could be because:
      </Typography>
      
      <Box sx={{ color: '#888', textAlign: 'left' }}>
        <Typography variant="body2">• You're not a member of the Char3 workspace</Typography>
        <Typography variant="body2">• You denied access to the application</Typography>
        <Typography variant="body2">• There was a technical error</Typography>
      </Box>

      <Button
        onClick={() => router.push('/auth/signin')}
        sx={{
          bgcolor: '#ff6b35',
          color: 'white',
          px: 3,
          py: 1.5,
          '&:hover': {
            bgcolor: '#e55a2b'
          }
        }}
      >
        Try Again
      </Button>
    </Box>
  );
}

