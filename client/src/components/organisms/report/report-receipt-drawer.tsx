import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, LoaderCircle, Sparkles, Upload, X } from 'lucide-react';
import { useId, useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

import type {
  ReceiptDraft,
  ReceiptDraftField,
  ReportReceiptDrawerProps,
} from '../../pages/report-detail/report-detail.types';
import { fadeInUp, springRight, staggerContainer } from '@client/lib/motion';

const AI_FIELD_LABELS: Record<ReceiptDraftField, string> = {
  merchant: 'Merchant',
  description: 'Description',
  amount: 'Amount',
  currency: 'Currency',
  date: 'Date',
};

function ReceiptField({
  field,
  onDraftChange,
  value,
}: {
  field: ReceiptDraftField;
  onDraftChange: (patch: Partial<ReceiptDraft>) => void;
  value: ReceiptDraft;
}) {
  const id = useId();
  const isAiField = Boolean(value.aiExtractedFields[field]);
  const label = AI_FIELD_LABELS[field];
  const isAmount = field === 'amount';
  const isDate = field === 'date';
  const isCurrency = field === 'currency';

  return (
    <motion.div variants={fadeInUp} className="space-y-2">
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center gap-2 text-[12px] uppercase tracking-[0.04em] text-[--muted-foreground]"
      >
        <span>{label}</span>
        {isAiField && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 text-[11px] tracking-[0.04em] text-[--foreground]"
          >
            <Sparkles aria-hidden="true" className="size-3" strokeWidth={1.5} />
            AI
          </motion.span>
        )}
      </label>
      <input
        id={id}
        name={field}
        autoComplete="off"
        className="min-h-12 w-full border-0 border-b border-border/40 bg-transparent px-0 py-3 text-[14px] text-[--foreground] focus:border-[rgb(255,107,0)]/40 focus:ring-0 focus-visible:outline-none transition-[border-color,color] duration-150 placeholder:text-[#a3a3a3]"
        inputMode={isAmount ? 'decimal' : undefined}
        placeholder={`${label}…`}
        min={isAmount ? '0' : undefined}
        spellCheck={isCurrency ? false : undefined}
        step={isAmount ? '0.01' : undefined}
        type={isDate ? 'date' : isAmount ? 'number' : 'text'}
        value={value[field] ?? ''}
        onChange={(event) => onDraftChange({ [field]: event.currentTarget.value })}
      />

    </motion.div>
  );
}

export function ReportReceiptDrawer({
  draft,
  drawer,
  initialDraft,
  isSavingReceipt,
  isUploadingReceipt,
  onChooseReceipt,
  onClose,
  onDraftChange,
  onRetryUpload,
  onSave,
  pendingItemStatus,
  reportStatus,
}: ReportReceiptDrawerProps) {
  const fileInputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canUpload = reportStatus === 'DRAFT' || reportStatus === 'REJECTED';
  const isBusy = isUploadingReceipt || drawer.step === 'processing';

  const isEditMode = initialDraft !== undefined;
  const isDirty = isEditMode
    ? draft.merchant !== initialDraft.merchant ||
      draft.description !== initialDraft.description ||
      draft.amount !== initialDraft.amount ||
      draft.currency !== initialDraft.currency ||
      draft.date !== initialDraft.date
    : false;

  const hasRequiredFields =
    draft.merchant.trim() !== '' &&
    draft.amount.trim() !== '' &&
    draft.currency.trim() !== '' &&
    draft.date.trim() !== '';

  const isSaveDisabled =
    isSavingReceipt ||
    !hasRequiredFields ||
    (isEditMode && (!isDirty || reportStatus !== 'DRAFT'));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    onChooseReceipt(file);
    event.currentTarget.value = '';
  };

  const openPicker = () => {
    if (!canUpload) {
      return;
    }

    inputRef.current?.click();
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!canUpload) {
      return;
    }

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
    openPicker();
  };

  return (
    <AnimatePresence>
      {drawer.open && (
        <>
          <motion.button
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            aria-label="Close receipt drawer"
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            variants={springRight}
            initial="initial"
            animate="animate"
            exit="exit"
            aria-labelledby="receipt-drawer-title"
            aria-modal="true"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-border/40 bg-white"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-5">
              <div className="space-y-1">
                <p
                  id="receipt-drawer-title"
                  className="text-[16px] font-medium tracking-[-0.01em] text-[--foreground]"
                >
                  {drawer.step === 'review'
                    ? 'Review Extracted Item'
                    : drawer.step === 'failed'
                      ? 'Receipt Extraction Failed'
                      : 'Receipt Intake'}
                </p>
                <p className="text-[12px] uppercase tracking-[0.04em] text-[--muted-foreground]">
                  {drawer.fileName}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close receipt drawer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[--muted-foreground] transition-[background-color,color] duration-150 hover:bg-[--foreground]/5 hover:text-[--foreground] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--foreground]/20"
                onClick={onClose}
              >
                <X aria-hidden="true" className="size-4.5" strokeWidth={1.6} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                {drawer.step === 'upload' && (
                  <motion.section
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-border/40 bg-[--background] px-6 py-10 text-left shadow-sm transition-[border-color,background-color,transform,box-shadow] duration-200 hover:border-[--foreground]/15 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canUpload}
                      onClick={openPicker}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onKeyDown={handleKeyDown}
                    >
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border/40 bg-white shadow-sm transition-transform duration-300 hover:scale-105">
                        <Upload
                          aria-hidden="true"
                          className="size-6 text-muted-foreground/60"
                          strokeWidth={1}
                        />
                      </div>
                      <div className="mt-5 space-y-2 text-center">
                        <h2 className="text-[16px] font-medium tracking-[-0.01em] text-[--foreground]">
                          Upload a Receipt
                        </h2>

                      </div>
                    </button>

                    <input
                      id={fileInputId}
                      ref={inputRef}
                      aria-label="Choose a receipt to upload"
                      className="sr-only"
                      name="receipt"
                      type="file"
                      accept="image/*,.pdf,.txt"
                      onChange={handleFileChange}
                    />

                    <button
                      type="button"
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[--foreground] px-4 text-[14px] font-medium text-white transition-[background-color,opacity] duration-150 hover:bg-[--foreground]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--foreground]/20 disabled:opacity-50"
                      disabled={!canUpload}
                      onClick={openPicker}
                    >
                      <FileUp aria-hidden="true" className="size-4" strokeWidth={1.6} />
                      Choose Receipt
                    </button>
                  </motion.section>
                )}

                {drawer.step === 'processing' && (
                  <motion.section
                    key="processing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8 py-8 text-center"
                  >
                    <div className="mx-auto flex h-[280px] w-full max-w-[320px] items-center justify-center rounded-[32px] border border-border/40 bg-[--background] shadow-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-transparent animate-pulse" />
                      <div className="relative h-[180px] w-[130px] rounded-[24px] border border-border/40 bg-white shadow-2xl overflow-hidden ring-1 ring-black/[0.02]">
                        <svg
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full text-[--muted-foreground]"
                          viewBox="0 0 124 168"
                          fill="none"
                        >
                          <rect
                            x="18"
                            y="26"
                            width="88"
                            height="8"
                            rx="4"
                            fill="currentColor"
                            opacity="0.16"
                          />
                          <rect
                            x="18"
                            y="48"
                            width="72"
                            height="8"
                            rx="4"
                            fill="currentColor"
                            opacity="0.14"
                          />
                          <rect
                            x="18"
                            y="70"
                            width="80"
                            height="8"
                            rx="4"
                            fill="currentColor"
                            opacity="0.14"
                          />
                          <rect
                            x="18"
                            y="92"
                            width="54"
                            height="8"
                            rx="4"
                            fill="currentColor"
                            opacity="0.14"
                          />
                          <rect
                            x="18"
                            y="114"
                            width="88"
                            height="8"
                            rx="4"
                            fill="currentColor"
                            opacity="0.14"
                          />
                        </svg>
                        <motion.div
                          className="absolute left-0 right-0 h-[3px] bg-[rgb(255,107,0)]/40 blur-[1px]"
                          animate={{ y: [0, 180, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-[16px] font-medium tracking-[-0.01em] text-[--foreground]">
                        Extracting...
                      </h2>
                      <p className="text-[12px] uppercase tracking-[0.04em] text-[--muted-foreground]">
                        {pendingItemStatus?.toLowerCase() || 'Analyzing receipt'}
                      </p>
                    </div>
                  </motion.section>
                )}

                {drawer.step === 'failed' && (
                  <motion.section
                    key="failed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl border border-border/40 bg-red-50/50 px-5 py-6 text-red-900 shadow-sm backdrop-blur-sm">
                      <h2 className="text-[15px] font-medium tracking-tight">Extraction Failed</h2>
                      <p className="mt-2 text-[13px] leading-relaxed opacity-80">
                        {drawer.error ||
                          'The receipt could not be parsed. Upload a clearer file or try again.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border/40 bg-white px-4 text-[14px] font-medium text-[--foreground] shadow-sm transition-[background-color,color,transform] duration-150 hover:bg-[--background] active:scale-[0.98]"
                      onClick={onRetryUpload}
                    >
                      Upload Another Receipt
                    </button>
                  </motion.section>
                )}

                {drawer.step === 'review' && (
                  <motion.section
                    key="review"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-6"
                  >
                    <motion.div
                      variants={fadeInUp}
                      className="rounded-2xl border border-border/40 bg-white px-5 py-4 shadow-sm"
                    >
                      <p className="text-[12px] uppercase tracking-[0.04em] text-[--muted-foreground]">
                        Review AI Extraction
                      </p>
                    </motion.div>
                    <div className="space-y-6">
                      <ReceiptField field="merchant" onDraftChange={onDraftChange} value={draft} />
                      <ReceiptField
                        field="description"
                        onDraftChange={onDraftChange}
                        value={draft}
                      />
                      <ReceiptField field="amount" onDraftChange={onDraftChange} value={draft} />
                      <ReceiptField field="currency" onDraftChange={onDraftChange} value={draft} />
                      <ReceiptField field="date" onDraftChange={onDraftChange} value={draft} />
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>

            <div
              className={`px-6 py-5 ${drawer.step === 'review' ? 'border-t border-border/40' : ''}`}
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            >
              <AnimatePresence mode="wait">
                {drawer.step === 'review' && (
                  <motion.button
                    key="save"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-black px-4 text-[14px] font-medium text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                    disabled={isSaveDisabled}
                    onClick={onSave}
                  >
                    {isSavingReceipt ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle className="size-4 animate-spin" />
                        {isEditMode ? 'Updating…' : 'Saving Item…'}
                      </span>
                    ) : isEditMode ? (
                      'Update Item'
                    ) : (
                      'Save Item'
                    )}
                  </motion.button>
                )}

                {drawer.step === 'processing' && (
                  <motion.div
                    key="busy"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-[#f9f9f9] px-4 text-[13px] text-muted-foreground shadow-inner"
                  >
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin text-[rgb(255,107,0)]"
                      strokeWidth={2}
                    />
                    Processing...
                  </motion.div>
                )}

                {drawer.step === 'failed' && (
                  <motion.button
                    key="retry"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border/40 bg-white px-4 text-[14px] font-medium text-black shadow-sm transition-colors duration-150 hover:bg-[#f9f9f9]"
                    onClick={onRetryUpload}
                  >
                    Try Another Receipt
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
