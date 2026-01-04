/**
 * @module pages/SettingsPage
 * User settings page for password management and two-factor authentication.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useEnable2fa, useDisable2fa } from '@/hooks/useAuth';
import { ShieldCheck, ShieldOff, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const enable2faMutation = useEnable2fa();
  const disable2faMutation = useDisable2fa();

  const handleEnable2fa = () => {
    enable2faMutation.mutate();
  };

  const handleDisable2fa = () => {
    disable2faMutation.mutate();
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Settings</h1>
        <p className='text-muted-foreground mt-2'>Manage your account security and preferences</p>
      </div>

      {/* Password Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Password Management</CardTitle>
          <CardDescription>Update your current password</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <KeyRound className='size-5 text-muted-foreground' />
                <p className='font-medium'>Change Password</p>
              </div>
              <p className='text-sm text-muted-foreground'>Update your current password</p>
            </div>
            <Button variant='outline'>Change Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                {user?.twoFactorEnabled ? (
                  <ShieldCheck className='size-5 text-green-500' />
                ) : (
                  <ShieldOff className='size-5 text-muted-foreground' />
                )}
                <p className='font-medium'>
                  Two-Factor Authentication {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <p className='text-sm text-muted-foreground'>
                {user?.twoFactorEnabled
                  ? 'Your account is protected with email-based verification codes'
                  : 'Enable email-based verification codes for additional security'}
              </p>
            </div>
            {user?.twoFactorEnabled ? (
              <Button variant='destructive' onClick={handleDisable2fa} disabled={disable2faMutation.isPending}>
                {disable2faMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            ) : (
              <Button onClick={handleEnable2fa} disabled={enable2faMutation.isPending}>
                {enable2faMutation.isPending ? 'Enabling...' : 'Enable 2FA'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
