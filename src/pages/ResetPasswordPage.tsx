/**
 * @module pages/ResetPasswordPage
 * Password reset page - validates reset token and allows user to set new password.
 * Users arrive here via email link with token query parameter.
 */
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useValidateResetToken, useResetPassword } from '@/hooks/useAuth';

// Password validation schema matching registration requirements
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Validate token on mount
  const {
    data: validationData,
    isLoading: isValidating,
    error: validationQueryError,
  } = useValidateResetToken(token || '');
  const resetPasswordMutation = useResetPassword();

  // Derive validation error state from query results (avoiding setState in useEffect)
  const validationError = useMemo(() => {
    if (!token) {
      return 'No reset token provided. Please use the link from your email.';
    }
    if (validationQueryError) {
      return 'Invalid or expired reset token. Please request a new password reset.';
    }
    return null;
  }, [token, validationQueryError]);

  // Extract email from nested response structure
  const email = validationData?.data?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    resetPasswordMutation.mutate(
      { token, newPassword: data.newPassword },
      {
        onSuccess: () => {
          // Navigate to login after successful reset
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        },
      }
    );
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center gap-4'>
              <Loader2 className='size-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>Validating reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - invalid or expired token
  if (validationError) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Card className='w-full max-w-md border-destructive'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <AlertCircle className='size-5 text-destructive' />
              <CardTitle>Invalid Reset Link</CardTitle>
            </div>
            <CardDescription>{validationError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className='w-full'>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after password reset
  if (resetPasswordMutation.isSuccess) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Card className='w-full max-w-md border-green-500'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-5 text-green-500' />
              <CardTitle>Password Reset Successful</CardTitle>
            </div>
            <CardDescription>Your password has been successfully reset. Redirecting to login...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Main form - valid token
  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {/* Email - Read Only */}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input id='email' type='email' value={email} readOnly disabled className='bg-muted' />
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
              />
              {errors.newPassword && <p className='text-sm text-destructive'>{errors.newPassword.message}</p>}
              <p className='text-xs text-muted-foreground'>
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='Confirm new password'
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <p className='text-sm text-destructive'>{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit Button */}
            <Button type='submit' className='w-full' disabled={isSubmitting || resetPasswordMutation.isPending}>
              {isSubmitting || resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className='size-4 mr-2 animate-spin' />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
