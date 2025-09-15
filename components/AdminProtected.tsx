'use client';

import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from '@/components/AdminLogin';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface AdminProtectedProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AdminProtected({ children, title, description }: AdminProtectedProps) {
  const { token, isAuthenticated, mounted, handleAuthenticated, handleLogout } = useAdminAuth();

  // Don't render anything until mounted (to avoid hydration mismatch)
  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Show login if not authenticated
  if (!token || isAuthenticated === false) {
    return <AdminLogin onAuthenticated={handleAuthenticated} />;
  }

  // Show loading while checking authentication
  if (isAuthenticated === undefined) {
    return <div className="flex items-center justify-center min-h-screen">Verifying access...</div>;
  }

  // Show protected content if authenticated
  return (
    <div className="space-y-8">
      {(title || description) && (
        <div className="flex justify-between items-center">
          <div>
            {title && <h1 className="text-3xl font-bold">{title}</h1>}
            {description && (
              <p className="text-gray-600 mt-2">
                {description}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}