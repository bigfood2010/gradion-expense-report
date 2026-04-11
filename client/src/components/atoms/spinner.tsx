import { cn } from '@client/lib/cn';

export interface SpinnerProps {
  readonly className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return <span aria-hidden="true" className={cn('spinner', className)} />;
}
