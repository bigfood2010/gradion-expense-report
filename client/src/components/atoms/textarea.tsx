import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@client/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('textarea', className)} {...props} />
  ),
);

Textarea.displayName = 'Textarea';
