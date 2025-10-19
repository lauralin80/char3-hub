'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, TextField, Button, Alert, Paper, Link } from '@mui/material';

export default function TokenAuthPage() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/token-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1a1a1a',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          bgcolor: '#2a2a2a',
          color: 'white',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#ff6b35' }}>
          Trello Token Authentication
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, color: '#ccc' }}>
          Enter your Trello token to access the dashboard
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Trello Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your Trello token here"
            required
            multiline
            rows={3}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: '#555',
                },
                '&:hover fieldset': {
                  borderColor: '#ff6b35',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff6b35',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#ccc',
                '&.Mui-focused': {
                  color: '#ff6b35',
                },
              },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: '#4a1a1a', color: 'white' }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !token.trim()}
            sx={{ 
              mb: 2,
              bgcolor: '#ff6b35',
              '&:hover': {
                bgcolor: '#e55a2b'
              },
              '&:disabled': {
                bgcolor: '#666',
                color: '#999'
              }
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/auth/signin')}
            sx={{
              borderColor: '#ff6b35',
              color: '#ff6b35',
              '&:hover': {
                borderColor: '#e55a2b',
                bgcolor: 'rgba(255, 107, 53, 0.1)'
              }
            }}
          >
            Back to Sign In
          </Button>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#333', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ color: '#ccc' }}>
            <strong>How to get your Trello token:</strong>
            <br />
            1. Go to{' '}
            <Link 
              href="https://trello.com/app-key" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ color: '#ff6b35' }}
            >
              https://trello.com/app-key
            </Link>
            <br />
            2. Copy your API key
            <br />
            3. Visit this URL (replace YOUR_API_KEY with your actual API key):
            <br />
            <Link 
              href={`https://trello.com/1/authorize?key=YOUR_API_KEY&return_url=http://localhost:3000&scope=read,write,account&expiration=never&name=Char3%20Dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#ff6b35', wordBreak: 'break-all' }}
            >
              Trello Authorization URL
            </Link>
            <br />
            4. Click "Allow" and copy the token from the URL
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
