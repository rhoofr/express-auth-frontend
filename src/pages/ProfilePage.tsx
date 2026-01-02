/**
 * @module pages/ProfilePage
 * User profile page displaying account information.
 */
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, KeyRound } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <div className='mx-auto max-w-4xl space-y-6 px-4'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Profile</h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <div className='size-16 rounded-full bg-primary/10 flex items-center justify-center'>
              <User className='size-8 text-primary' />
            </div>
            <div>
              <CardTitle className='text-2xl'>{user.fullName}</CardTitle>
              <CardDescription>Account Details</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='pt-4 border-t border-border space-y-6'>
            {/* Email */}
            <div className='flex items-start gap-4'>
              <Mail className='size-5 text-muted-foreground mt-0.5' />
              <div className='flex-1 space-y-1'>
                <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Email</p>
                <p className='text-base font-medium'>{user.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className='flex items-start gap-4'>
              <Shield className='size-5 text-muted-foreground mt-0.5' />
              <div className='flex-1 space-y-1'>
                <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>Role</p>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className='text-sm capitalize'>
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className='flex items-start gap-4'>
              <KeyRound className='size-5 text-muted-foreground mt-0.5' />
              <div className='flex-1 space-y-1'>
                <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
                  Two-Factor Authentication
                </p>
                <Badge variant={user.twoFactorEnabled ? 'default' : 'outline'} className='text-sm'>
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
