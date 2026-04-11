import {
  forwardRef,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@client/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, PropsWithChildren<ButtonProps>>(
  (
    {
      children,
      className,
      disabled,
      leadingIcon,
      loading = false,
      size = 'md',
      trailingIcon,
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'button',
        `button--${variant}`,
        size === 'icon' ? 'button--icon' : `button--${size}`,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <span className="button__content">
        {loading ? <LoaderCircle aria-hidden="true" className="button__spinner" /> : leadingIcon}
        {children}
        {!loading ? trailingIcon : null}
      </span>
    </button>
  ),
);

Button.displayName = 'Button';
