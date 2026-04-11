import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@client/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('input', className)} {...props} />
));

Input.displayName = 'Input';
