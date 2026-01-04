/**
 * @module pages/ChangePasswordPage
 * Change password page for authenticated users.
 * Requires current password verification before updating to new password.
 */
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { useChangePassword } from '@/hooks/useAuth';

// Password validation schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          reset();
          // Navigate back to settings after 1 second
          setTimeout(() => {
            navigate('/settings');
          }, 1000);
        },
      }
    );
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate('/settings')}>
          <ArrowLeft className='size-5' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>Change Password</h1>
          <p className='text-muted-foreground mt-1'>Update your account password</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <KeyRound className='size-5 text-primary' />
            <CardTitle>Password Update</CardTitle>
          </div>
          <CardDescription>Enter your current password and choose a new secure password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Current Password */}
            <div className='space-y-2'>
              <Label htmlFor='currentPassword'>Current Password</Label>
              <Input
                id='currentPassword'
                type='password'
                placeholder='Enter your current password'
                {...register('currentPassword')}
                disabled={isSubmitting}
                autoComplete='current-password'
                autoFocus
              />
              {errors.currentPassword && <p className='text-sm text-destructive'>{errors.currentPassword.message}</p>}
            </div>

            {/* New Password */}
            <div className='space-y-2'>
              <Label htmlFor='newPassword'>New Password</Label>
              <Input
                id='newPassword'
                type='password'
                placeholder='Enter new password'
                {...register('newPassword')}
                disabled={isSubmitting}
                autoComplete='new-password'
              />
              {errors.newPassword && <p className='text-sm text-destructive'>{errors.newPassword.message}</p>}
              <p className='text-xs text-muted-foreground'>
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm New Password */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='Confirm new password'
                {...register('confirmPassword')}
                disabled={isSubmitting}
                autoComplete='new-password'
              />
              {errors.confirmPassword && <p className='text-sm text-destructive'>{errors.confirmPassword.message}</p>}
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-4'>
              <Button type='submit' disabled={isSubmitting || changePasswordMutation.isPending}>
                {isSubmitting || changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className='size-4 mr-2 animate-spin' />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
              <Button type='button' variant='outline' onClick={() => navigate('/settings')} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
