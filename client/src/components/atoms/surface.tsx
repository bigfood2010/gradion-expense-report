import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@client/lib/cn';

type SurfaceVariant = 'default' | 'muted' | 'interactive' | 'dashed';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly padded?: boolean;
  readonly variant?: SurfaceVariant;
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, padded = true, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'surface',
        padded && 'surface--padded',
        variant === 'muted' && 'surface--muted',
        variant === 'interactive' && 'surface--interactive',
        variant === 'dashed' && 'surface--dashed',
        className,
      )}
      {...props}
    />
  ),
);

Surface.displayName = 'Surface';
