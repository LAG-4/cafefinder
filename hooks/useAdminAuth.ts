'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check authentication status
  const isAuthenticated = useQuery(
    api.auth.isAdminAuthenticated, 
    token ? { token } : "skip"
  );

  useEffect(() => {
    setMounted(true);
    // Check for stored token on mount
    const storedToken = localStorage.getItem('admin-token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleAuthenticated = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    setToken(null);
  };

  return {
    token,
    isAuthenticated,
    mounted,
    handleAuthenticated,
    handleLogout
  };
}