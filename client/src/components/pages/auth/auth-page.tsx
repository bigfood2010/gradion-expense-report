import type { ReactElement, ReactNode } from 'react';
import { AuthTemplate } from '@client/components/templates/auth-template';
import {
  AuthForm,
  type AuthFormMode,
  type AuthFormProps,
  type AuthFormValues,
} from '@client/components/organisms/auth/auth-form';

export interface AuthPageProps {
  readonly mode: AuthFormMode;
  readonly title: string;
  readonly description: string;
  readonly footer: ReactNode;
  readonly loading: boolean;
  readonly error: string | null;
  readonly errorRef?: AuthFormProps['errorRef'];
  readonly values: AuthFormValues;
  readonly onSubmit: AuthFormProps['onSubmit'];
  readonly onFieldChange: AuthFormProps['onFieldChange'];
}

export function AuthPage({
  description,
  error,
  errorRef,
  footer,
  loading,
  mode,
  onFieldChange,
  onSubmit,
  title,
  values,
}: AuthPageProps): ReactElement {
  return (
    <AuthTemplate description={description} footer={footer} title={title}>
      <AuthForm
        error={error}
        errorRef={errorRef}
        loading={loading}
        mode={mode}
        onFieldChange={onFieldChange}
        onSubmit={onSubmit}
        values={values}
      />
    </AuthTemplate>
  );
}
