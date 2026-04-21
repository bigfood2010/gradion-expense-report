import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { FileText, Pen, Send, CheckCircle2, XCircle } from 'lucide-react';
import { type ReportStatus } from '@gradion/shared/enums';
import { cn } from '@client/lib/cn';

type StatusConfig = {
  label: string;
  icon: typeof FileText;
  bgClass: string;
  textClass: string;
};

const defaultConfig: StatusConfig = {
  label: 'Total',
  icon: FileText,
  bgClass: 'bg-neutral-100',
  textClass: 'text-neutral-600',
};

const statusConfig: Record<string, StatusConfig> = {
  total: {
    label: 'Total Reports',
    icon: FileText,
    bgClass: 'bg-neutral-100',
    textClass: 'text-neutral-600',
  },
  DRAFT: {
    label: 'Draft',
    icon: Pen,
    bgClass: 'bg-neutral-100',
    textClass: 'text-neutral-600',
  },
  SUBMITTED: {
    label: 'Submitted',
    icon: Send,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
  },
};

interface StatusCardProps {
  readonly count: number;
  readonly status: ReportStatus | null;
  readonly isActive: boolean;
  readonly onClick: (status: ReportStatus | null) => void;
}

function StatusCard({ count, isActive, onClick, status }: StatusCardProps): ReactElement {
  const key = status ?? 'total';
  const config = statusConfig[key] ?? defaultConfig;
  const Icon = config.icon;

  const compactIconProps = { size: 16, strokeWidth: 1.6 };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(status)}
      className={cn(
        'group relative flex flex-1 flex-row items-center gap-2 rounded-[10px] border border-black/[0.06] bg-white px-2 py-2 transition-all duration-300',
        isActive
          ? 'border-primary/30 bg-primary/5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
          : 'hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
          isActive ? 'bg-primary text-white' : `${config.bgClass} ${config.textClass}`,
        )}
      >
        <Icon {...compactIconProps} />
      </div>

      <div className="flex flex-col items-start">
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-[20px] font-medium tracking-tight leading-none whitespace-nowrap',
            isActive ? 'text-primary' : 'text-foreground',
          )}
        >
          {count}
        </motion.div>
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
          {config.label}
        </p>
      </div>
    </motion.button>
  );
}

export interface DashboardSummaryGridProps {
  readonly draftCount: number;
  readonly submittedCount: number;
  readonly approvedCount: number;
  readonly rejectedCount: number;
  readonly totalCount: number;
  readonly activeStatus: ReportStatus | null;
  readonly onStatusChange: (status: ReportStatus | null) => void;
}

export function DashboardSummaryGrid({
  activeStatus,
  approvedCount,
  draftCount,
  onStatusChange,
  rejectedCount,
  submittedCount,
  totalCount,
}: DashboardSummaryGridProps): ReactElement {
  const statuses: { status: ReportStatus | null; count: number }[] = [
    { status: null, count: totalCount },
    { status: 'DRAFT', count: draftCount },
    { status: 'SUBMITTED', count: submittedCount },
    { status: 'APPROVED', count: approvedCount },
    { status: 'REJECTED', count: rejectedCount },
  ];

  return (
    <>
      {statuses.map(({ count, status }) => (
        <StatusCard
          key={status ?? 'total'}
          count={count}
          isActive={activeStatus === status}
          onClick={onStatusChange}
          status={status}
        />
      ))}
    </>
  );
}
