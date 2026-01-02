/**
 * @module components/AdminRoute
 * Route wrapper that requires user authentication AND admin role.
 * Redirects to login if not authenticated, or to forbidden page if not admin.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // First check: User must be authenticated
  if (!isAuthenticated) {
    // Redirect to login, save original location
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Second check: User must have admin role
  if (user?.role !== 'admin') {
    // User is authenticated but not an admin
    // Redirect to forbidden page
    return <Navigate to='/forbidden' replace />;
  }

  // User is authenticated AND admin - render protected content
  return <>{children}</>;
}
