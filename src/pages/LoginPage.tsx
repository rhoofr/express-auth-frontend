/**
 * @module pages/LoginPage
 * Login page with email/password authentication and 2FA support.
 * Uses React Hook Form with Zod validation.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { useLogin, useConfirm2fa, useResendConfirmation } from '@/hooks/useAuth';
import type { ApiErrorResponse, TwoFactorRequiredResponse } from '@/types/api';
import { Mail, ShieldCheck } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

// 2FA form schema
const twoFactorSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Get the page user was trying to access (if redirected from protected route)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // 2FA state
  const [userId, setUserId] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false); // Add state for remember device checkbox

  // Email confirmation state
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // Hooks
  const loginMutation = useLogin();
  const confirm2faMutation = useConfirm2fa();
  const resendConfirmationMutation = useResendConfirmation();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'user@email.com',
      password: 'SecurePass123!',
    },
  });

  // 2FA form
  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  // Redirect if already authenticated (in effect, not during render)
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Handle login submission
  const handleLogin = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        // Check if 2FA is required
        if ('data' in response && response.data && 'userId' in response.data && !('email' in response.data)) {
          // 2FA required - only has userId, not full user object
          const twoFactorData = response as TwoFactorRequiredResponse;
          if (twoFactorData.data) {
            setUserId(twoFactorData.data.userId);
            setRequires2FA(true);
          }
        } else {
          // Login successful - has full user object, redirect to original page
          navigate(from, { replace: true });
        }
      },
      onError: (error: ApiErrorResponse) => {
        // Check if error is due to unconfirmed email
        if (error.error?.code === 'EMAIL_NOT_CONFIRMED') {
          setUnconfirmedEmail(loginForm.getValues('email'));
          setShowResendConfirmation(true);
        }
        // For all other errors (invalid credentials, account locked, etc.),
        // the toast notification from useLogin hook will display the error message.
        // The form will remain visible so user can try again.
      },
    });
  };

  // Handle 2FA code submission
  const handleConfirm2FA = (data: TwoFactorFormData) => {
    if (!userId) return;

    confirm2faMutation.mutate(
      {
        userId,
        code: data.code,
        rememberDevice, // Pass the remember device state to the mutation
      },
      {
        onSuccess: () => {
          // 2FA verified, redirect to original page
          navigate(from, { replace: true });
        },
      }
    );
  };

  // Handle resend confirmation email
  const handleResendConfirmation = () => {
    if (!unconfirmedEmail) return;

    resendConfirmationMutation.mutate(
      { email: unconfirmedEmail },
      {
        onSuccess: () => {
          // Reset state after successful resend
          setShowResendConfirmation(false);
          setUnconfirmedEmail(null);
        },
      }
    );
  };

  // Show email confirmation needed prompt
  if (showResendConfirmation) {
    return (
      <div className='mx-auto max-w-lg space-y-6 px-4'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Mail className='size-5 text-yellow-500' />
              <CardTitle>Email Confirmation Required</CardTitle>
            </div>
            <CardDescription>
              Your email address has not been confirmed. Please check your inbox for a confirmation email.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Didn't receive the email? Click the button below to send a new confirmation email to{' '}
              <span className='font-medium'>{unconfirmedEmail}</span>.
            </p>
            <div className='flex gap-2'>
              <Button
                onClick={handleResendConfirmation}
                disabled={resendConfirmationMutation.isPending}
                className='flex-1'>
                {resendConfirmationMutation.isPending ? 'Sending...' : 'Resend Confirmation Email'}
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setShowResendConfirmation(false);
                  setUnconfirmedEmail(null);
                }}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show 2FA form if required
  if (requires2FA) {
    return (
      <div className='mx-auto max-w-lg space-y-6 px-4'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='size-5 text-primary' />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>Enter the 6-digit code sent to your email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={twoFactorForm.handleSubmit(handleConfirm2FA)} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='code'>Verification Code</Label>
                <Input
                  id='code'
                  type='text'
                  maxLength={6}
                  {...twoFactorForm.register('code')}
                  disabled={confirm2faMutation.isPending}
                  className='text-center text-2xl tracking-widest'
                />
                {twoFactorForm.formState.errors.code && (
                  <p className='text-sm text-red-500'>{twoFactorForm.formState.errors.code.message}</p>
                )}
              </div>

              {/* Remember Device Checkbox */}
              <div className='flex items-center space-x-2 rounded-md border p-3 bg-muted/50'>
                <input
                  type='checkbox'
                  id='remember-device'
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  disabled={confirm2faMutation.isPending}
                  className='size-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                />
                <label htmlFor='remember-device' className='text-sm text-muted-foreground cursor-pointer select-none'>
                  Remember device (30 days)
                </label>
              </div>

              <Button type='submit' className='w-full' disabled={confirm2faMutation.isPending}>
                {confirm2faMutation.isPending ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => {
                  setRequires2FA(false);
                  setUserId(null);
                  setRememberDevice(false); // Reset remember device state when going back
                  twoFactorForm.reset();
                }}>
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login form
  return (
    <div className='mx-auto max-w-lg space-y-6 px-4'>
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='user@example.com'
                {...loginForm.register('email')}
                disabled={loginMutation.isPending}
              />
              {loginForm.formState.errors.email && (
                <p className='text-sm text-red-500'>{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                {...loginForm.register('password')}
                disabled={loginMutation.isPending}
              />
              {loginForm.formState.errors.password && (
                <p className='text-sm text-red-500'>{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className='flex items-center justify-end'>
              <Link to='/forgot-password' className='text-sm text-primary hover:underline'>
                Forgot password?
              </Link>
            </div>

            <Button type='submit' className='w-full' disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>

            <p className='text-center text-sm text-muted-foreground'>
              Don't have an account?{' '}
              <Link to='/register' className='text-primary hover:underline'>
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
