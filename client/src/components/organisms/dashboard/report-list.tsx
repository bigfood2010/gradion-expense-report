import { type ReactElement, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import type { ExpenseReportSummaryDto } from '@gradion/shared/reports';
import { Button } from '@client/components/atoms/button';
import { EmptyState } from '@client/components/molecules/empty-state';
import { Spinner } from '@client/components/atoms/spinner';
import { StatusBadge } from '@client/components/atoms/status-badge';
import { Surface } from '@client/components/atoms/surface';
import { formatCurrency, formatDate } from '@client/lib/format';
import { fadeInUp, staggerContainer } from '@client/lib/motion';

export interface ReportListProps {
  readonly reports: readonly ExpenseReportSummaryDto[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly emptyAction: ReactNode;
}

const headerGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 100px 100px 100px 40px',
  alignItems: 'center',
  padding: '16px 0',
  borderBottom: '1px solid rgba(0,0,0,0.04)',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'rgba(0,0,0,0.4)',
};

const rowGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 100px 100px 100px 40px',
  alignItems: 'center',
  minHeight: '72px',
  borderBottom: '1px solid rgba(0,0,0,0.04)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 0.2s ease',
};

export function ReportList({
  emptyAction,
  error,
  loading,
  onRetry,
  reports,
}: ReportListProps): ReactElement {
  if (loading) {
    return (
      <Surface
        variant="muted"
        className="u-stack"
        style={{ justifyItems: 'center', padding: 'var(--space-10)' }}
      >
        <Spinner />
        <div className="u-muted-copy">Loading Reports…</div>
      </Surface>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to Load Reports"
        description={error}
        action={<Button onClick={onRetry}>Try Again</Button>}
      />
    );
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No Reports Yet"
        description="Create your first expense report to get started."
        action={emptyAction}
      />
    );
  }

  return (
    <section aria-label="Expense reports" className="u-stack" style={{ gap: 0 }}>
      <div style={headerGridStyle}>
        <span>Title</span>
        <span>Date</span>
        <span>Status</span>
        <span style={{ textAlign: 'right' }}>Amount</span>
        <span aria-hidden="true" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col"
      >
        <AnimatePresence mode="popLayout">
          {reports.map((report) => (
            <motion.div key={report.id} variants={fadeInUp} layout>
              <Link
                aria-label={`Open report ${report.title}`}
                className="group relative hover:bg-black/[0.01]"
                style={rowGridStyle}
                to={'/reports/$reportId' as any}
                params={{ reportId: report.id } as any}
              >
                <span className="truncate pr-4 text-[15px] font-bold text-foreground">
                  {report.title}
                </span>
                <span className="text-[14px] text-muted-foreground/60">
                  {formatDate(report.createdAt)}
                </span>
                <div>
                  <StatusBadge status={report.status} />
                </div>
                <span className="text-right text-[15px] font-bold text-foreground">
                  {formatCurrency(report.totalAmount, report.currency ?? 'USD')}
                </span>
                <div className="flex items-center justify-end">
                  <ArrowRight
                    size={16}
                    strokeWidth={1.2}
                    className="opacity-0 transition-all group-hover:opacity-30 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
