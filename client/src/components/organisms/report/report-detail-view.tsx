import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, LoaderCircle, Plus, ReceiptText, Sparkles, Trash2 } from 'lucide-react';
import { useId, useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

import { cn } from '@client/lib/cn';
import { formatCurrency, formatDate } from '@client/lib/format';
import { fadeInUp, staggerContainer } from '@client/lib/motion';
import styles from './report-organisms.module.css';
import type {
  ReportDetailOrganismProps,
  ReportExpenseItem,
} from '../../pages/report-detail/report-detail.types';
import { EmptyState } from '../../molecules/empty-state';

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

function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('status-badge', getStatusTone(status))}>
      {status.toLowerCase().charAt(0).toUpperCase() + status.toLowerCase().slice(1)}
    </span>
  );
}

function ItemRow({
  canDelete,
  currency,
  deletingItemId,
  item,
  onDeleteItem,
  onReviewItem,
}: {
  canDelete: boolean;
  currency?: string | null;
  deletingItemId: string | null;
  item: ReportExpenseItem;
  onDeleteItem: (itemId: string) => void | Promise<void>;
  onReviewItem: (item: ReportExpenseItem) => void;
}) {
  const isProcessing = item.aiStatus === 'PROCESSING';
  const needsReview = item.aiStatus === 'COMPLETED' && !item.aiExtracted;
  const hasFailed = item.aiStatus === 'FAILED';

  return (
    <motion.div
      layout
      variants={fadeInUp}
      exit={{ opacity: 0, x: -20 }}
      className={`group grid items-center border-b border-black/[0.04] py-5 transition-colors hover:bg-black/[0.01] ${
        canDelete
          ? 'grid-cols-[1fr_80px_100px_40px_40px]'
          : 'grid-cols-[1fr_80px_100px_40px]'
      }`}
    >
      <div className="min-w-0 pr-4">
        {isProcessing ? (
          <p className="flex items-center gap-1.5 text-[14px] text-muted-foreground/60">
            <LoaderCircle className="size-3.5 animate-spin text-[rgb(255,107,0)]" strokeWidth={2} />
            Extracting…
          </p>
        ) : needsReview ? (
          <button
            type="button"
            className="group/review flex items-center gap-2 text-left"
            onClick={() => onReviewItem(item)}
          >
            <span className="truncate text-[15px] font-bold text-foreground">
              {item.merchant || <span className="font-normal text-muted-foreground/60">No merchant</span>}
            </span>
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 group-hover/review:bg-amber-100">
              Review
            </span>
          </button>
        ) : (
          <p className="truncate text-[15px] font-bold text-foreground">{item.merchant}</p>
        )}
        {!isProcessing && (
          <p className="mt-1 truncate text-[13px] text-muted-foreground/70">
            {hasFailed
              ? 'Extraction failed'
              : item.description?.trim() || 'No description'}
          </p>
        )}
      </div>
      <p className="text-[14px] text-muted-foreground/60">
        {isProcessing ? '—' : item.date ? formatDate(item.date) : '—'}
      </p>
      <p className="text-right text-[15px] font-bold text-foreground">
        {isProcessing ? '—' : formatCurrency(Number(item.amount), item.currency || currency || 'USD')}
        {!isProcessing && parseFloat(String(item.amount ?? 0)) <= 0 && (
          <span className="ml-1 inline-flex size-2 rounded-full bg-amber-400" title="Amount required for submission" />
        )}
      </p>
      <div className="flex items-center justify-end pl-2">
        {item.aiExtracted && (
          <Sparkles size={14} className="text-muted-foreground/50" strokeWidth={1.8} />
        )}
      </div>
      {canDelete ? (
        <div className="flex items-center justify-end pl-2">
          <button
            type="button"
            aria-busy={deletingItemId === item.id}
            aria-label={`Delete ${item.merchant?.trim() || item.description?.trim() || 'expense'} item`}
            className={`inline-flex size-10 items-center justify-center rounded-full border border-transparent transition-all duration-200 ${
              deletingItemId === item.id
                ? 'cursor-wait bg-red-50 text-red-600 opacity-100'
                : 'text-muted-foreground/40 opacity-90 group-hover:bg-red-50 group-hover:text-red-600 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:bg-red-50 focus-visible:text-red-600'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-wait disabled:opacity-100 disabled:text-red-600`}
            disabled={deletingItemId === item.id}
            onClick={() => void onDeleteItem(item.id)}
          >
            {deletingItemId === item.id ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}

export function ReportDetailView({
  canSubmitReport,
  deletingItemId,
  invalidItemCount,
  isSavingTitle,
  isSubmitting,
  onChooseReceipt,
  titleIsDirty,
  onReportTitleChange,
  onReportTitleCommit,
  onReportTitleDiscard,
  onDeleteItem,
  onOpenDrawer,
  onReviewItem,
  onSubmitReport,
  reportTitle,
  reportTitleError,
  report,
}: ReportDetailOrganismProps) {
  const receiptInputId = useId();
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const isEditable =
    report.status === 'DRAFT' || report.status === 'REJECTED' || report.canEdit === true;
  const titleIsReadOnly = !isEditable;
  const canDeleteItems = report.status === 'DRAFT' || report.status === 'REJECTED';

  const openReceiptPicker = () => {
    receiptInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    onChooseReceipt(file);
    event.currentTarget.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (file) {
      onChooseReceipt(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openReceiptPicker();
  };

  return (
    <motion.section
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      <motion.div variants={fadeInUp} className="flex flex-col gap-6 pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {titleIsReadOnly ? (
              <h1 className="text-[32px] font-bold tracking-tight text-foreground">
                {report.title}
              </h1>
            ) : (
              <input
                id="report-title"
                autoComplete="off"
                className={`flex-1 border-0 bg-transparent py-0 text-[32px] font-bold tracking-tight text-foreground outline-none focus:ring-0 ${
                  reportTitleError ? 'text-red-600' : ''
                }`}
                placeholder="Untitled Report"
                value={reportTitle}
                onBlur={() => void onReportTitleCommit()}
                onChange={(e) => onReportTitleChange(e.target.value)}
              />
            )}
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="text-[15px] text-muted-foreground/70">
            {formatCurrency(report.totalAmount, report.currency || 'USD')} · {report.items.length}{' '}
            item
            {report.items.length === 1 ? '' : 's'}
          </p>
        </div>

        {isEditable && (
          <div className="flex items-center justify-between border-t border-black/[0.04] pt-8">
            <p className="text-[13px] text-muted-foreground/40">
              {isSavingTitle ? (
                'Saving changes…'
              ) : invalidItemCount > 0 ? (
                <span className="text-amber-600 text-sm font-medium">
                  {invalidItemCount} item{invalidItemCount !== 1 ? 's' : ''} need{invalidItemCount === 1 ? 's' : ''} a valid amount before submission.
                </span>
              ) : (
                <span className="text-muted-foreground">Finalize your report for submission.</span>
              )}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-8 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-20"
              disabled={!canSubmitReport || isSubmitting}
              onClick={onSubmitReport}
            >
              {isSubmitting
                ? 'Submitting…'
                : titleIsDirty && report.items.length === 0
                  ? 'Save Changes'
                  : 'Submit Report'}
            </motion.button>
          </div>
        )}
      </motion.div>

      {report.items.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Add your first expense item below by dragging a receipt or clicking the upload area."
          illustration={<ReceiptText size={32} strokeWidth={1.75} />}
        />
      ) : (
        <motion.section variants={fadeInUp} className="pt-12">
          <div
            className={`grid border-b border-black/[0.04] pb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 ${
              canDeleteItems
                ? 'grid-cols-[1fr_80px_100px_40px_40px]'
                : 'grid-cols-[1fr_80px_100px_40px]'
            }`}
          >
            <h2 className="font-bold">Merchant</h2>
            <span className="">Date</span>
            <span className="text-right">Amount</span>
            <span className="text-right">AI</span>
            {canDeleteItems ? <span aria-hidden="true" /> : null}
          </div>
          <motion.div layout>
            <AnimatePresence mode="popLayout">
              {report.items.map((item) => (
                <ItemRow
                  currency={report.currency}
                  deletingItemId={deletingItemId}
                  canDelete={canDeleteItems}
                  item={item}
                  onDeleteItem={onDeleteItem}
                  onReviewItem={onReviewItem}
                  key={item.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      )}

      {isEditable && (
        <>
          <input
            id={receiptInputId}
            ref={receiptInputRef}
            aria-label="Upload receipt from report"
            className="sr-only"
            type="file"
            accept="image/*,.pdf,.txt"
            onChange={handleFileChange}
          />
          <motion.button
            variants={fadeInUp}
            type="button"
            className="group flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-black/[0.08] bg-white transition-all duration-300 hover:border-black/[0.15] hover:bg-black/[0.01] hover:shadow-sm"
            onClick={openReceiptPicker}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onKeyDown={handleKeyDown}
          >
            <span className="text-muted-foreground/40 transition-all duration-300 group-hover:scale-110 group-hover:text-muted-foreground/60">
              <Plus aria-hidden="true" className="size-6" strokeWidth={1.2} />
            </span>
            <p className="text-[13px] font-medium text-muted-foreground/50 transition-colors group-hover:text-muted-foreground/80">
              Drag a receipt here or click to upload
            </p>
          </motion.button>
        </>
      )}
    </motion.section>
  );
}
