import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@client/lib/cn';

export interface FieldProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly trailingMeta?: ReactNode;
  readonly className?: string;
}

export function Field({
  children,
  className,
  error,
  hint,
  htmlFor,
  label,
  trailingMeta,
}: PropsWithChildren<FieldProps>) {
  return (
    <div className={cn('field', className)}>
      <div className="field__meta">
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
        {trailingMeta}
      </div>
      {children}
      {error ? (
        <div className="field__error">{error}</div>
      ) : hint ? (
        <div className="field__hint">{hint}</div>
      ) : null}
    </div>
  );
}
