/**
 * @module components/Navbar
 * Application navbar with navigation, theme switcher, and auth controls.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useLogout, useLogoutAll } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, User, LogOut, Settings } from 'lucide-react';

interface NavbarProps {
  routes: { path: string; label: string; protected: boolean }[];
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export function Navbar({ routes, theme, setTheme }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logoutMutation = useLogout();
  const logoutAllMutation = useLogoutAll();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  const handleLogoutAll = () => {
    logoutAllMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  // Filter routes based on authentication status
  const visibleRoutes = routes.filter((route) => {
    // Show public routes to everyone
    if (!route.protected) return true;
    // Show protected routes only to authenticated users
    return isAuthenticated;
  });

  return (
    <nav className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between'>
      <div className='flex items-center gap-6'>
        <p className='font-bold text-lg text-primary'>Express Auth Frontend</p>
        <ul className='flex gap-4'>
          {visibleRoutes.map((route) => (
            <li key={route.path}>
              <Link
                to={route.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === route.path ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                }`}>
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className='flex items-center gap-4'>
        {/* Theme Switcher */}
        {theme && setTheme && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                {theme === 'light' ? <Sun className='size-5' /> : <Moon className='size-5' />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className='size-4 mr-2' />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className='size-4 mr-2' />
                Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Auth Controls */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <User className='size-4 mr-2' />
                {user.fullName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className='size-4 mr-2' />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className='size-4 mr-2' />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogoutAll} disabled={logoutAllMutation.isPending}>
                <LogOut className='size-4 mr-2' />
                {logoutAllMutation.isPending ? 'Logging out all...' : 'Logout All Devices'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant='outline' size='sm' onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}
