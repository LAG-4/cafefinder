'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onAuthenticated: (token: string) => void;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const authenticateAdmin = useMutation(api.auth.authenticateAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authenticateAdmin({ password });
      
      if (result.success && result.token) {
        // Store token in localStorage for persistence
        localStorage.setItem('admin-token', result.token);
        onAuthenticated(result.token);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your password to access the admin dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !password.trim()}
              >
                {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This area is restricted to authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}