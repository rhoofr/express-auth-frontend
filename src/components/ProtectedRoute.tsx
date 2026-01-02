/**
 * @module components/ProtectedRoute
 * Route wrapper that requires user authentication.
 * Redirects to login page if user is not authenticated.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page, but save the location they were trying to access
    // This allows us to redirect them back after successful login
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
