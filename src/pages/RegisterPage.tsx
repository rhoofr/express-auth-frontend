/**
 * @module pages/RegisterPage
 * Registration page with email/password/fullName form.
 * Uses React Hook Form with Zod validation.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Registration form schema
const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(1, 'Full name is required').min(2, 'Full name must be at least 2 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const registerMutation = useRegister();

  // Registration form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle registration submission
  const handleRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        // Reset form
        registerForm.reset();
        // Navigate to login after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      },
    });
  };

  return (
    <div className='mx-auto max-w-lg space-y-6 px-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Create an account</CardTitle>
          <CardDescription>Enter your information to create a new account</CardDescription>
        </CardHeader>

        <CardContent>
          <form className='space-y-6' onSubmit={registerForm.handleSubmit(handleRegister)}>
            <FieldGroup>
              <Controller
                name='fullName'
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='register-fullName'>Full Name</FieldLabel>
                    <Input
                      {...field}
                      id='register-fullName'
                      type='text'
                      placeholder='Enter your full name'
                      aria-invalid={fieldState.invalid}
                      disabled={registerMutation.isPending}
                      autoComplete='name'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='email'
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='register-email'>Email address</FieldLabel>
                    <Input
                      {...field}
                      id='register-email'
                      type='email'
                      placeholder='Enter your email'
                      aria-invalid={fieldState.invalid}
                      disabled={registerMutation.isPending}
                      autoComplete='email'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='password'
                control={registerForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='register-password'>Password</FieldLabel>
                    <Input
                      {...field}
                      id='register-password'
                      type='password'
                      placeholder='Create a strong password'
                      aria-invalid={fieldState.invalid}
                      disabled={registerMutation.isPending}
                      autoComplete='new-password'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    {!fieldState.invalid && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        Must contain: 8+ characters, uppercase, lowercase, number, special character
                      </p>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <div className='space-y-4'>
              <Button
                type='submit'
                className='w-full'
                disabled={registerMutation.isPending || !registerForm.formState.isValid}>
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className='size-4 mr-2 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <div className='text-center text-sm'>
                <span className='text-muted-foreground'>Already have an account? </span>
                <a href='/login' className='text-primary hover:underline'>
                  Sign in
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
