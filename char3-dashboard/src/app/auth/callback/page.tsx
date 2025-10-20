'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback on the client side
    const handleCallback = async () => {
      try {
        // Get the token from the URL fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('token');

        if (!token) {
          console.error('No token found in callback');
          router.push('/auth/error');
          return;
        }

        // Send the token to our server to create the session
        const response = await fetch('/api/auth/token-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Ensure cookies are included
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          console.log('Authentication successful, redirecting...');
          // Wait a brief moment for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 100));
          // Successfully authenticated, use window.location for a full page reload
          window.location.href = '/';
        } else {
          const errorData = await response.json();
          console.error('Authentication failed:', errorData.error);
          router.push('/auth/error');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/auth/error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#ff6b35' }}>Authenticating...</h2>
        <p>Please wait while we complete your login.</p>
      </div>
    </div>
  );
}

