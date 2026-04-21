import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ReceiptText, Sparkles, X } from 'lucide-react';

import type { AdminDashboardPageProps, AdminReportView } from '../../pages/admin/admin.types';
import { cn } from '@client/lib/cn';
import { formatCurrency, formatDate } from '@client/lib/format';
import { fadeInUp, staggerContainer } from '@client/lib/motion';
import { EmptyState } from '../../molecules/empty-state';
import styles from './admin-organisms.module.css';

function getStatusTone(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'status-badge--approved';
    case 'SUBMITTED':
      return 'status-badge--submitted';
    case 'REJECTED':
      return 'status-badge--rejected';
    default:
      return 'status-badge--draft';
  }
}

function formatStatusLabel(status: string) {
  if (!status) return '—';
  const normalized = status.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('status-badge', getStatusTone(status))}>{formatStatusLabel(status)}</span>
  );
}

function AdminAccordionRow({
  activeReportId,
  approvingReportId,
  onApproveReport,
  onRejectReport,
  onToggleReport,
  rejectingReportId,
  report,
}: {
  activeReportId: string | null;
  approvingReportId: string | null;
  onApproveReport: (reportId: string) => void | Promise<void>;
  onRejectReport: (reportId: string) => void | Promise<void>;
  onToggleReport: (reportId: string) => void;
  rejectingReportId: string | null;
  report: AdminReportView;
}) {
  const isExpanded = activeReportId === report.id;
  const isSubmitted = report.status === 'SUBMITTED';

  return (
    <motion.div
      variants={fadeInUp}
      layout
      className="border-b border-border/40 bg-white transition-colors duration-200 hover:bg-black/[0.01]"
    >
      <div className="group grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_120px_120px_110px] md:items-center">
        <button
          type="button"
          className="grid min-w-0 grid-cols-1 gap-3 text-left md:col-span-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_120px_120px]"
          onClick={() => onToggleReport(report.id)}
        >
          <span className="min-w-0">
            <span className="block truncate text-[14.5px] font-medium text-[--foreground]">
              {report.title}
            </span>
            <span className="mt-1 block break-words text-[12px] leading-5 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80">
              {report.description?.trim() || 'No description provided'}
            </span>
          </span>
          <span className="min-w-0 break-words text-[13px] text-[--muted-foreground]">
            {report.user?.email || 'Unassigned'}
          </span>
          <span className="text-[13px] text-[--muted-foreground]">
            {formatDate(report.createdAt)}
          </span>
          <span>
            <StatusBadge status={report.status} />
          </span>
          <span className={`${styles.numberColumn} text-[14px] text-[--foreground] md:text-right`}>
            {formatCurrency(report.totalAmount, report.currency || 'USD')}
          </span>
        </button>

        <div className="flex items-center justify-end gap-2">
          {isSubmitted ? (
            <AnimatePresence>
              <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <motion.button
                  key="approve"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  aria-label={`Approve ${report.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[--status-approved-text] shadow-sm ring-1 ring-inset ring-black/[0.04] bg-white"
                  disabled={approvingReportId === report.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onApproveReport(report.id);
                  }}
                >
                  <Check aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </motion.button>
                <motion.button
                  key="reject"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  aria-label={`Reject ${report.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[--status-rejected-text] shadow-sm ring-1 ring-inset ring-black/[0.04] bg-white"
                  disabled={rejectingReportId === report.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRejectReport(report.id);
                  }}
                >
                  <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </motion.button>
              </div>
            </AnimatePresence>
          ) : null}
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${report.title}`}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
              isExpanded
                ? 'bg-black text-white'
                : 'text-muted-foreground hover:bg-black/5 hover:text-black',
            )}
            onClick={() => onToggleReport(report.id)}
          >
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 transition-transform duration-300', isExpanded && 'rotate-180')}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-[#fafafa] shadow-inner"
          >
            <div className="px-4 py-5">
              {report.items.length === 0 ? (
                <div className="py-12 flex flex-col items-center">
                  <EmptyState
                    title="No items found"
                    description="This report doesn't have any attached expense items yet."
                    illustration={<ReceiptText size={28} strokeWidth={1.75} />}
                    className="py-0"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {report.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-border/40 bg-white px-4 py-4 shadow-sm md:grid-cols-[minmax(0,1.3fr)_140px_120px_minmax(0,1fr)] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 truncate text-[14px] text-[--foreground]">
                            {item.merchant}
                          </p>
                          {item.aiExtracted && (
                            <Sparkles
                              aria-hidden="true"
                              className="size-3.5 text-[--muted-foreground]"
                              strokeWidth={1.4}
                            />
                          )}
                        </div>
                        <p className="mt-1 break-words text-[12px] leading-5 text-[--muted-foreground]">
                          {item.description?.trim() || 'No description'}
                        </p>
                      </div>
                      <p className="text-[13px] text-[--muted-foreground]">
                        {item.date ? formatDate(item.date) : '—'}
                      </p>
                      <p
                        className={`${styles.numberColumn} text-[14px] text-[--foreground] md:text-right`}
                      >
                        {formatCurrency(
                          Number(item.amount),
                          item.currency || report.currency || 'USD',
                        )}
                      </p>
                      <div className="min-w-0 space-y-1.5 text-[12px] text-muted-foreground/80">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40">
                            AI Result
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide transition-colors',
                              item.aiStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : item.aiStatus === 'FAILED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse',
                            )}
                          >
                            {item.aiStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40">
                            Receipt
                          </span>
                          <a
                            href={item.receiptUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:text-black hover:underline"
                          >
                            {item.receiptUrl ? 'View Original Document' : 'Pending Upload'}
                          </a>
                        </div>
                        {item.extractionError && (
                          <p className="mt-1 font-medium text-red-600/80">
                            Error: {item.extractionError}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AdminReportsTable({
  activeReportId,
  approvingReportId,
  onApproveReport,
  onRejectReport,
  onToggleReport,
  rejectingReportId,
  reports,
}: Pick<
  AdminDashboardPageProps,
  | 'activeReportId'
  | 'approvingReportId'
  | 'onApproveReport'
  | 'onRejectReport'
  | 'onToggleReport'
  | 'rejectingReportId'
  | 'reports'
>) {
  if (reports.length === 0) {
    return (
      <EmptyState
        title="No Reports Yet"
        description="Submitted reports appear here for review. Drafts remain editable in the employee workspace."
        illustration={<ReceiptText size={32} strokeWidth={1.75} />}
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/40 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="hidden border-b border-border/40 px-4 py-3 text-[11px] uppercase tracking-[0.06em] text-muted-foreground md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_120px_120px_110px] md:items-center">
        <span>Title</span>
        <span>Submitter</span>
        <span>Date</span>
        <span>Status</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {reports.map((report) => (
          <AdminAccordionRow
            key={report.id}
            activeReportId={activeReportId}
            approvingReportId={approvingReportId}
            onApproveReport={onApproveReport}
            onRejectReport={onRejectReport}
            onToggleReport={onToggleReport}
            rejectingReportId={rejectingReportId}
            report={report}
          />
        ))}
      </motion.div>
    </section>
  );
}
