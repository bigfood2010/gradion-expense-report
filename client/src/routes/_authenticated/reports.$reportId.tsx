import { createFileRoute, Navigate, useBlocker, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ReportDetailPage } from '../../components/pages/report-detail/report-detail-page';
import type {
  ReceiptDraft,
  ReceiptDrawerState,
  ReportDetailView,
  ReportExpenseItem,
} from '../../components/pages/report-detail/report-detail.types';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';
import {
  useAuthSession,
  useDeleteExpenseItemMutation,
  useExpenseReportDetailQuery,
  useExpenseReportItemsQuery,
  useSubmitExpenseReportMutation,
  useUpdateExpenseItemMutation,
  useUploadExpenseItemMutation,
} from '../../lib/hooks';

export const Route = createFileRoute('/_authenticated/reports/$reportId' as any)({
  component: ReportDetailRoute,
});

const EMPTY_DRAFT: ReceiptDraft = {
  merchant: '',
  description: '',
  amount: '',
  currency: 'USD',
  date: '',
  receiptUrl: null,
  aiExtractedFields: {},
};

const EMPTY_DRAWER: ReceiptDrawerState = {
  open: false,
  step: 'upload',
  fileName: null,
  pendingItemId: null,
  error: null,
};

function toAmountString(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return typeof value === 'number' ? value.toFixed(2) : value;
}

export function buildDraftFromItem(item: ReportExpenseItem): ReceiptDraft {
  const aiDidExtract = item.aiStatus === 'COMPLETED' || item.aiExtracted;
  return {
    merchant: item.merchant || '',
    description: item.description || '',
    amount: toAmountString(item.amount),
    currency: item.currency || 'USD',
    date: item.date || '',
    receiptUrl: item.receiptUrl,
    aiExtractedFields: aiDidExtract
      ? {
          ...(item.merchant != null && { merchant: true as const }),
          ...(item.description != null && { description: true as const }),
          ...(item.amount != null && { amount: true as const }),
          ...(item.currency != null && { currency: true as const }),
          ...(item.date != null && { date: true as const }),
        }
      : {},
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function countInvalidSubmitItems(items: ReportExpenseItem[]) {
  return items.filter((item) => {
    if (item.aiStatus === 'PROCESSING') {
      return true;
    }

    if (item.aiStatus === 'COMPLETED' && !item.aiExtracted) {
      return true;
    }

    return parseFloat(String(item.amount ?? 0)) <= 0;
  }).length;
}

export function ReportDetailRoute() {
  const { reportId } = Route.useParams();
  const navigate = useNavigate();
  const { signOut, user } = useAuthSession();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ReceiptDraft>(EMPTY_DRAFT);
  const [savedDraft, setSavedDraft] = useState<ReceiptDraft | undefined>(undefined);
  const [drawer, setDrawer] = useState<ReceiptDrawerState>(EMPTY_DRAWER);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportTitleBaseline, setReportTitleBaseline] = useState('');
  const [reportTitleError, setReportTitleError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const leaveConfirmResolveRef = useRef<((shouldStay: boolean) => void) | null>(null);
  const leaveConfirmPromiseRef = useRef<Promise<boolean> | null>(null);

  const reportQuery = useExpenseReportDetailQuery(reportId);
  const itemsQuery = useExpenseReportItemsQuery(reportId, {
    enabled: Boolean(reportId),
    refetchInterval: drawer.step === 'processing' ? 2000 : false,
  });
  const submitReportMutation = useSubmitExpenseReportMutation(reportId);
  const uploadReceiptMutation = useUploadExpenseItemMutation(reportId);
  const updateItemMutation = useUpdateExpenseItemMutation();
  const deleteItemMutation = useDeleteExpenseItemMutation();
  const updateReportMutation = useMutation({
    mutationFn: async (title: string) => apiClient.reports.update(reportId, { title }),
    onSuccess: async (updatedReport) => {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
      ]);

      setReportTitle(updatedReport.title);
      setReportTitleBaseline(updatedReport.title);
      setReportTitleError(null);
    },
  });

  const report = reportQuery.data
    ? ({
        ...reportQuery.data,
        items: (itemsQuery.data?.items ?? []) as ReportExpenseItem[],
      } as ReportDetailView)
    : null;

  useEffect(() => {
    if (!reportQuery.data) {
      return;
    }

    setReportTitle(reportQuery.data.title);
    setReportTitleBaseline(reportQuery.data.title);
    setReportTitleError(null);
  }, [reportQuery.data?.id]);

  const titleIsDirty = reportTitle.trim() !== reportTitleBaseline.trim();
  const isSavingTitle = updateReportMutation.isPending;
  const hasUnsavedChanges = useMemo(
    () =>
      titleIsDirty ||
      drawer.open ||
      isSavingTitle ||
      updateItemMutation.isPending ||
      uploadReceiptMutation.isPending ||
      submitReportMutation.isPending,
    [
      drawer.open,
      isSavingTitle,
      submitReportMutation.isPending,
      titleIsDirty,
      updateItemMutation.isPending,
      uploadReceiptMutation.isPending,
    ],
  );

  const confirmLeave = () => {
    if (leaveConfirmOpen) {
      // Dialog already open — keep current navigation blocked
      return Promise.resolve(true);
    }

    const promise = new Promise<boolean>((resolve) => {
      leaveConfirmResolveRef.current = resolve;
      setLeaveConfirmOpen(true);
    });

    leaveConfirmPromiseRef.current = promise;
    return promise;
  };

  const cancelLeaveConfirm = () => {
    leaveConfirmResolveRef.current?.(true);
    leaveConfirmResolveRef.current = null;
    leaveConfirmPromiseRef.current = null;
    setLeaveConfirmOpen(false);
  };

  const confirmLeaveConfirm = () => {
    leaveConfirmResolveRef.current?.(false);
    leaveConfirmResolveRef.current = null;
    leaveConfirmPromiseRef.current = null;
    setLeaveConfirmOpen(false);
  };

  useBlocker({
    enableBeforeUnload: hasUnsavedChanges,
    shouldBlockFn: () => {
      if (!hasUnsavedChanges) {
        return false;
      }

      return confirmLeave();
    },
  });

  useEffect(() => {
    if (!drawer.pendingItemId || drawer.step !== 'processing') {
      return;
    }

    const pendingItem = report?.items.find((item) => item.id === drawer.pendingItemId);

    if (!pendingItem) {
      return;
    }

    if (pendingItem.aiStatus === 'COMPLETED') {
      const completedDraft = buildDraftFromItem(pendingItem);
      setDraft(completedDraft);
      setDrawer((current) => ({
        ...current,
        step: 'review',
        error: null,
      }));
      return;
    }

    if (pendingItem.aiStatus === 'FAILED') {
      setDrawer((current) => ({
        ...current,
        step: 'failed',
        error:
          pendingItem.extractionError ||
          'The receipt could not be parsed. Upload another file to continue.',
      }));
    }
  }, [drawer.pendingItemId, drawer.step, report?.items]);

  if (user?.role === 'admin') {
    return <Navigate to={'/admin' as any} />;
  }

  const handleTitleChange = (value: string) => {
    setReportTitle(value);
    if (value.trim()) {
      setReportTitleError(null);
    }
  };

  const saveTitle = async () => {
    if (isSavingTitle) {
      return true;
    }

    const nextTitle = reportTitle.trim();
    if (!nextTitle) {
      setReportTitleError('Report title is required.');
      return false;
    }

    if (nextTitle === reportTitleBaseline.trim()) {
      setReportTitle(nextTitle);
      setReportTitleError(null);
      return true;
    }

    try {
      setReportTitleError(null);
      await updateReportMutation.mutateAsync(nextTitle);
      return true;
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save the report title.');
      setReportTitleError(message);
      toast.error(message, { id: 'report-title-save' });
      return false;
    }
  };

  const handleTitleCommit = () => {
    void saveTitle();
  };

  const handleTitleDiscard = () => {
    setReportTitle(reportTitleBaseline);
    setReportTitleError(null);
  };

  const handleOpenDrawer = () => {
    setDraft(EMPTY_DRAFT);
    setSavedDraft(undefined);
    setDrawer({
      open: true,
      step: 'upload',
      fileName: null,
      pendingItemId: null,
      error: null,
    });
  };

  const handleOpenReviewDrawer = (item: ReportExpenseItem) => {
    const d = buildDraftFromItem(item);
    setDraft(d);
    setSavedDraft(d);
    setDrawer({
      open: true,
      step: 'review',
      fileName: item.receiptOriginalName ?? item.id,
      pendingItemId: item.id,
      error: null,
    });
  };

  const handleCloseDrawer = () => {
    setDraft(EMPTY_DRAFT);
    setSavedDraft(undefined);
    setDrawer(EMPTY_DRAWER);
  };

  const handleChooseReceipt = async (file: File) => {
    setSavedDraft(undefined);
    setDrawer({
      open: true,
      step: 'processing',
      fileName: file.name,
      pendingItemId: null,
      error: null,
    });

    try {
      const { item } = await uploadReceiptMutation.mutateAsync({ receipt: file });
      setDrawer((current) => ({ ...current, pendingItemId: item.id }));
    } catch (error) {
      setDrawer({
        open: true,
        step: 'failed',
        fileName: file.name,
        pendingItemId: null,
        error: getErrorMessage(error, 'Upload failed. Please try again.'),
      });
    }
  };

  const handleSaveReceipt = async () => {
    if (!drawer.pendingItemId) return;

    try {
      await updateItemMutation.mutateAsync({
        itemId: drawer.pendingItemId,
        payload: {
          merchant: draft.merchant.trim(),
          description: draft.description.trim() || null,
          amount: draft.amount.trim(),
          currency: draft.currency.trim() || 'USD',
          date: draft.date,
          aiExtracted: true,
        },
      });
      handleCloseDrawer();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the expense item.'));
    }
  };

  const handleRetryUpload = () => {
    setSavedDraft(undefined);
    setDrawer({
      open: true,
      step: 'upload',
      fileName: null,
      pendingItemId: null,
      error: null,
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);

    try {
      await deleteItemMutation.mutateAsync({ itemId });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete this item.'), {
        id: 'report-item-delete',
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleSubmitReport = async () => {
    if (!report || drawer.open || reportTitle.trim().length === 0) {
      return;
    }

    if (titleIsDirty) {
      const saved = await saveTitle();
      if (!saved) {
        return;
      }
    }

    // If no items yet, we only saved the title above — don't submit
    if (report.items.length === 0) {
      return;
    }

    try {
      await submitReportMutation.mutateAsync();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to submit this report.'), {
        id: 'report-submit',
      });
    }
  };

  const invalidItemCount = report ? countInvalidSubmitItems(report.items) : 0;

  const canSubmitReport =
    Boolean(report) &&
    reportTitle.trim().length > 0 &&
    !drawer.open &&
    !isSavingTitle &&
    !updateItemMutation.isPending &&
    !uploadReceiptMutation.isPending &&
    !submitReportMutation.isPending &&
    invalidItemCount === 0 &&
    (titleIsDirty || (report?.items.length ?? 0) > 0);

  const handleSignOut = async () => {
    if (hasUnsavedChanges) {
      const shouldStay = await confirmLeave();
      if (shouldStay) {
        return;
      }
    }

    await signOut();
  };

  return (
    <ReportDetailPage
      currentUser={user}
      deletingItemId={deletingItemId}
      draft={draft}
      savedDraft={savedDraft}
      drawer={drawer}
      canSubmitReport={canSubmitReport}
      invalidItemCount={invalidItemCount}
      isLoading={reportQuery.isLoading}
      isSavingTitle={isSavingTitle}
      isSavingReceipt={updateItemMutation.isPending}
      isSubmitting={submitReportMutation.isPending}
      isUploadingReceipt={uploadReceiptMutation.isPending}
      titleIsDirty={titleIsDirty}
      leaveConfirmOpen={leaveConfirmOpen}
      onBack={() => navigate({ to: '/' })}
      onCancelLeaveConfirm={cancelLeaveConfirm}
      onConfirmLeaveConfirm={confirmLeaveConfirm}
      onChooseReceipt={handleChooseReceipt}
      onCloseDrawer={handleCloseDrawer}
      onDeleteItem={handleDeleteItem}
      onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      onOpenDrawer={handleOpenDrawer}
      onReportTitleChange={handleTitleChange}
      onReportTitleCommit={handleTitleCommit}
      onReportTitleDiscard={handleTitleDiscard}
      onReviewItem={handleOpenReviewDrawer}
      onRetryUpload={handleRetryUpload}
      onSaveReceipt={handleSaveReceipt}
      onSignOut={handleSignOut}
      onSubmitReport={handleSubmitReport}
      reportTitle={reportTitle}
      reportTitleError={reportTitleError}
      report={report}
    />
  );
}
