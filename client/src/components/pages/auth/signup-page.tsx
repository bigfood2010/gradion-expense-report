import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { AuthPage } from './auth-page';
import { getAuthErrorMessage } from './auth-error-message';
import { useAuth } from '@client/lib/auth-context';
import type { AuthFormValues } from '@client/components/organisms/auth/auth-form';

export function SignupPage(): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<AuthFormValues>({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  if (auth.isAuthenticated) {
    return <Navigate replace to={'/' as any} />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      await navigate({ to: '/' as any });
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage
      description="Enter your details to get started"
      error={error}
      errorRef={errorRef}
      footer={
        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={'/login' as any}
            className="text-foreground underline-offset-4 transition-opacity duration-150 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
      loading={loading}
      mode="signup"
      onFieldChange={(field, value) => {
        setValues((current) => ({ ...current, [field]: value }));
      }}
      onSubmit={handleSubmit}
      title="Create account"
      values={values}
    />
  );
}
