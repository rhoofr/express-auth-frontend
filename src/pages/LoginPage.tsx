/**
 * @module pages/LoginPage
 * Login page with email/password authentication and 2FA support.
 * Uses React Hook Form with Zod validation.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useLogin, useConfirm2fa } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { TwoFactorRequiredResponse } from '@/types/api';

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

  // Hooks
  const loginMutation = useLogin();
  const confirm2faMutation = useConfirm2fa();

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
    });
  };

  // Handle 2FA code submission
  const handleConfirm2FA = (data: TwoFactorFormData) => {
    if (!userId) return;

    confirm2faMutation.mutate(
      {
        userId,
        code: data.code,
      },
      {
        onSuccess: () => {
          // 2FA verified, redirect to original page
          navigate(from, { replace: true });
        },
      }
    );
  };

  // Show loading state
  if (loginMutation.isPending && !requires2FA) {
    return (
      <div className='flex items-center justify-center min-h-[calc(100vh-4rem)]'>
        <Loader2 className='size-8 animate-spin text-primary' />
      </div>
    );
  }

  // Show 2FA form if required
  if (requires2FA) {
    return (
      <div className='mx-auto max-w-lg space-y-6 px-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>Two-Factor Authentication</CardTitle>
            <CardDescription>Enter the verification code sent to your email</CardDescription>
          </CardHeader>

          <CardContent>
            <form className='space-y-6' onSubmit={twoFactorForm.handleSubmit(handleConfirm2FA)}>
              <FieldGroup>
                <Field data-invalid={!!twoFactorForm.formState.errors.code}>
                  <FieldLabel htmlFor='2fa-code'>Verification Code</FieldLabel>
                  <Input
                    {...twoFactorForm.register('code')}
                    id='2fa-code'
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Enter 6-digit code'
                    aria-invalid={!!twoFactorForm.formState.errors.code}
                    disabled={confirm2faMutation.isPending}
                    autoComplete='one-time-code'
                  />
                  {twoFactorForm.formState.errors.code && <FieldError errors={[twoFactorForm.formState.errors.code]} />}
                </Field>
              </FieldGroup>

              <div className='space-y-3'>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={confirm2faMutation.isPending || !twoFactorForm.formState.isValid}>
                  {confirm2faMutation.isPending ? (
                    <>
                      <Loader2 className='size-4 mr-2 animate-spin' />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className='text-center'>
                  <button
                    type='button'
                    className='text-sm text-primary hover:underline'
                    onClick={() => {
                      setRequires2FA(false);
                      setUserId(null);
                      twoFactorForm.reset();
                    }}>
                    Back to login
                  </button>
                </div>
              </div>
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
          <CardTitle className='text-2xl'>Sign in to your account</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form className='space-y-6' onSubmit={loginForm.handleSubmit(handleLogin)}>
            <FieldGroup>
              <Controller
                name='email'
                control={loginForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='login-email'>Email address</FieldLabel>
                    <Input
                      {...field}
                      id='login-email'
                      type='email'
                      placeholder='Enter your email'
                      aria-invalid={fieldState.invalid}
                      disabled={loginMutation.isPending}
                      autoComplete='email'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='password'
                control={loginForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='login-password'>Password</FieldLabel>
                    <Input
                      {...field}
                      id='login-password'
                      type='password'
                      placeholder='Enter your password'
                      aria-invalid={fieldState.invalid}
                      disabled={loginMutation.isPending}
                      autoComplete='current-password'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <div className='space-y-4'>
              <Button
                type='submit'
                className='w-full'
                disabled={loginMutation.isPending || !loginForm.formState.isValid}>
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className='size-4 mr-2 animate-spin' />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className='flex items-center justify-between text-sm'>
                <a href='/forgot-password' className='text-primary hover:underline'>
                  Forgot password?
                </a>
                <a href='/register' className='text-primary hover:underline'>
                  Create account
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
