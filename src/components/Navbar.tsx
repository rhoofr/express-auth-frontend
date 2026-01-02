/**
 * @module components/Navbar
 * Application navbar with navigation, theme switcher, and auth controls.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sun, Moon, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useAuth';

interface NavbarProps {
  routes: { path: string; label: string }[];
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export function Navbar({ routes, theme, setTheme }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <nav className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between'>
      <div className='flex items-center gap-6'>
        <p className='font-bold text-lg text-primary'>Express Auth Frontend</p>
        <ul className='flex gap-4'>
          {routes.map((route) => (
            <li key={route.path}>
              <Link
                to={route.path}
                className={cn(
                  'text-gray-700 dark:text-gray-200 hover:text-primary transition-colors',
                  location.pathname === route.path && 'font-semibold underline underline-offset-4'
                )}>
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
              <Button
                variant='outline'
                size='sm'
                aria-label={`Switch theme (current: ${theme})`}
                title={`Current theme: ${theme}`}>
                {theme === 'dark' ? <Moon className='size-4' /> : <Sun className='size-4' />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Auth Controls */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='flex items-center gap-2'>
                <User className='size-4' />
                <span className='hidden sm:inline'>{user.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <div className='px-2 py-1.5 text-sm'>
                <div className='font-medium'>{user.fullName}</div>
                <div className='text-muted-foreground text-xs'>{user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className='size-4 mr-2' />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
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
