import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@client/lib/cn';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly icon: ReactNode;
  readonly 'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn('icon-button', className)} {...props}>
      {icon}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
