import type { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@client/lib/cn';
import { Surface } from '@client/components/atoms/surface';

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly illustration?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({
  action,
  className,
  description,
  title,
  illustration = <FolderOpen size={32} strokeWidth={1.75} />,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500',
        className,
      )}
    >
      <div className="mb-6 text-muted-foreground/40 transition-transform duration-300 hover:scale-110">
        {illustration}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[17px] font-medium tracking-tight text-foreground">{title}</h3>
        <p className="max-w-[320px] text-[14px] leading-relaxed text-muted-foreground/50">
          {description}
        </p>
      </div>
      {action && <div className="mt-10">{action}</div>}
    </div>
  );
}
