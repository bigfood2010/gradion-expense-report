import type { ReportStatus } from '@gradion/shared/enums';
import { cn } from '@client/lib/cn';

const statusClassName: Record<ReportStatus, string> = {
  APPROVED: 'status-badge--approved',
  DRAFT: 'status-badge--draft',
  REJECTED: 'status-badge--rejected',
  SUBMITTED: 'status-badge--submitted',
};

const statusLabel: Record<ReportStatus, string> = {
  APPROVED: 'Approved',
  DRAFT: 'Draft',
  REJECTED: 'Rejected',
  SUBMITTED: 'Submitted',
};

export interface StatusBadgeProps {
  readonly status: ReportStatus;
  readonly className?: string;
}

export function StatusBadge({ className, status }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', statusClassName[status], className)}>
      {statusLabel[status]}
    </span>
  );
}
