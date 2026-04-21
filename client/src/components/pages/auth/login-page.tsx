import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { AuthPage } from './auth-page';
import { getAuthErrorMessage } from './auth-error-message';
import { useAuth } from '@client/lib/auth-context';
import type { AuthFormValues } from '@client/components/organisms/auth/auth-form';

export function LoginPage(): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<AuthFormValues>({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  if (auth.isAuthenticated) {
    return <Navigate replace to={auth.user?.role === 'admin' ? ('/admin' as any) : ('/' as any)} />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await auth.login({
        email: values.email.trim(),
        password: values.password,
      });
      await navigate({ to: session.user.role === 'admin' ? ('/admin' as any) : ('/' as any) });
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email: string, password: string): void => {
    setValues((current) => ({ ...current, email, password }));
  };

  return (
    <AuthPage
      description="Enter your credentials to continue"
      error={error}
      errorRef={errorRef}
      footer={
        <>
          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to={'/signup' as any}
              className="text-foreground underline-offset-4 transition-opacity duration-150 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <div className="auth-template__credentials mt-6">
            <p className="mb-1 font-medium text-foreground">Demo credentials</p>
            <button
              type="button"
              className="-mx-2 w-full cursor-pointer rounded px-2 py-0.5 text-left transition-colors hover:bg-black/5 active:bg-black/10"
              onClick={() => fillCredentials('david@openai.com', 'Password1!')}
            >
              User 1: david@openai.com
            </button>
            <button
              type="button"
              className="-mx-2 w-full cursor-pointer rounded px-2 py-0.5 text-left transition-colors hover:bg-black/5 active:bg-black/10"
              onClick={() => fillCredentials('sarah@openai.com', 'Password1!')}
            >
              User 2: sarah@openai.com
            </button>
            <button
              type="button"
              className="-mx-2 w-full cursor-pointer rounded px-2 py-0.5 text-left transition-colors hover:bg-black/5 active:bg-black/10"
              onClick={() => fillCredentials('admin@openai.com', 'password1!')}
            >
              Admin: admin@openai.com
            </button>
          </div>
        </>
      }
      loading={loading}
      mode="login"
      onFieldChange={(field, value) => {
        setValues((current) => ({ ...current, [field]: value }));
      }}
      onSubmit={handleSubmit}
      title="Sign in"
      values={values}
    />
  );
}
