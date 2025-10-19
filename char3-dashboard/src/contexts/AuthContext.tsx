'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  trelloToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  refreshAuth: () => void;
  checkWorkspaceAccess: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const checkWorkspaceAccess = async (): Promise<boolean> => {
    if (!user?.trelloToken) return false;

    try {
      // Check if user is member of any of our boards
      const boardIds = [
        process.env.NEXT_PUBLIC_TRELLO_BOARD_ID,
        process.env.NEXT_PUBLIC_TRELLO_DESIGN_UX_BOARD_ID,
        process.env.NEXT_PUBLIC_TRELLO_DEVELOPMENT_BOARD_ID,
        process.env.NEXT_PUBLIC_TRELLO_WEEKLY_PLANNING_BOARD_ID
      ].filter(Boolean);

      for (const boardId of boardIds) {
        try {
          const response = await fetch(`/api/trello/check-board-access?boardId=${boardId}`, {
            headers: {
              'Authorization': `Bearer ${user.trelloToken}`
            }
          });
          
          if (response.ok) {
            return true; // User has access to at least one board
          }
        } catch (error) {
          console.error(`Error checking access to board ${boardId}:`, error);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking workspace access:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      console.log('Refresh auth response:', response.status, response.ok);
      if (response.ok) {
        const userData = await response.json();
        console.log('Refresh auth - User data received:', userData);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        console.log('Auth check response:', response.status, response.ok);
        if (response.ok) {
          const userData = await response.json();
          console.log('User data received:', userData);
          setUser(userData);
          
          // Check workspace access for real users
          // Temporarily disabled to debug authentication
          // const hasAccess = await checkWorkspaceAccess();
          // if (!hasAccess) {
          //   alert('You do not have access to the Char3 workspace. Please contact your administrator.');
          //   await signOut();
          // }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for focus events to refresh auth when user returns to tab
    const handleFocus = () => {
      if (!user) {
        console.log('Window focused, refreshing auth...');
        refreshAuth();
      }
    };

    // Also check auth periodically if no user is set
    const interval = setInterval(() => {
      if (!user) {
        console.log('Periodic auth check...');
        refreshAuth();
      }
    }, 2000); // Check every 2 seconds

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    refreshAuth,
    checkWorkspaceAccess,
  };
  
  console.log('AuthContext - User:', user, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
