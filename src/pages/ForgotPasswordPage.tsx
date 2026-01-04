/**
 * @module pages/ForgotPasswordPage
 * Forgot password page - allows users to request a password reset email.
 * Public page accessible without authentication.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useRequestPasswordReset } from '@/hooks/useAuth';
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

// Email validation schema
const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const requestResetMutation = useRequestPasswordReset();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    requestResetMutation.mutate(
      { email: data.email },
      {
        onSuccess: () => {
          setSubmittedEmail(data.email);
          setEmailSent(true);
        },
      }
    );
  };

  // Success state - email sent
  if (emailSent) {
    return (
      <div className='mx-auto max-w-lg space-y-6 px-4'>
        <Card className='border-green-500'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-5 text-green-500' />
              <CardTitle>Check Your Email</CardTitle>
            </div>
            <CardDescription>We've sent you password reset instructions</CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <div className='rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4'>
              <div className='flex gap-3'>
                <Mail className='size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5' />
                <div className='space-y-2 flex-1'>
                  <p className='text-sm font-medium text-green-900 dark:text-green-100'>
                    If an account exists for <span className='font-semibold'>{submittedEmail}</span>, you will receive
                    password reset instructions shortly.
                  </p>
                  <p className='text-sm text-green-800 dark:text-green-200'>
                    Please check your email and click the link to reset your password.
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <Button type='button' variant='outline' className='w-full' onClick={() => navigate('/login')}>
                <ArrowLeft className='size-4 mr-2' />
                Back to Login
              </Button>
            </div>

            <div className='text-center text-sm text-muted-foreground space-y-1'>
              <p>Didn't receive the email?</p>
              <button
                type='button'
                className='text-primary hover:underline'
                onClick={() => {
                  setEmailSent(false);
                  setSubmittedEmail('');
                }}>
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state - request password reset
  return (
    <div className='mx-auto max-w-lg space-y-6 px-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Forgot Your Password?</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
        </CardHeader>

        <CardContent>
          <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name='email'
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='forgot-password-email'>Email address</FieldLabel>
                    <Input
                      {...field}
                      id='forgot-password-email'
                      type='email'
                      placeholder='Enter your email address'
                      aria-invalid={fieldState.invalid}
                      disabled={isSubmitting || requestResetMutation.isPending}
                      autoComplete='email'
                      autoFocus
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
                disabled={isSubmitting || requestResetMutation.isPending || Object.keys(errors).length > 0}>
                {isSubmitting || requestResetMutation.isPending ? (
                  <>
                    <Loader2 className='size-4 mr-2 animate-spin' />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className='size-4 mr-2' />
                    Send Reset Link
                  </>
                )}
              </Button>

              <div className='text-center'>
                <button
                  type='button'
                  className='text-sm text-primary hover:underline inline-flex items-center gap-1'
                  onClick={() => navigate('/login')}>
                  <ArrowLeft className='size-3' />
                  Back to Login
                </button>
              </div>
            </div>
          </form>

          <div className='mt-6 text-center text-sm text-muted-foreground'>
            <p>Remember your password?</p>
            <a href='/login' className='text-primary hover:underline'>
              Sign in instead
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
