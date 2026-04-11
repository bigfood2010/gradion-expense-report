import { WorkspaceTemplate } from '@client/components/templates/workspace-template';
import { ReportDetailView } from '@client/components/organisms/report/report-detail-view';
import { ReportLeaveConfirmDialog } from '@client/components/organisms/report/report-leave-confirm-dialog';
import { ReportReceiptDrawer } from '@client/components/organisms/report/report-receipt-drawer';
import { ArrowLeft } from 'lucide-react';
import type { ReportDetailPageProps } from './report-detail.types';

export function ReportDetailPage({
  currentUser,
  deletingItemId,
  draft,
  drawer,
  canSubmitReport,
  isLoading,
  isSavingTitle,
  isSavingReceipt,
  isSubmitting,
  isUploadingReceipt,
  leaveConfirmOpen,
  onBack,
  onCancelLeaveConfirm,
  onConfirmLeaveConfirm,
  onChooseReceipt,
  onCloseDrawer,
  onDeleteItem,
  onDraftChange,
  onOpenDrawer,
  onRetryUpload,
  onReportTitleChange,
  onReportTitleCommit,
  onReportTitleDiscard,
  onReviewItem,
  onSaveReceipt,
  onSignOut,
  onSubmitReport,
  reportTitle,
  reportTitleError,
  savedDraft,
  titleIsDirty,
  report,
  invalidItemCount,
}: ReportDetailPageProps) {
  const actions = (
    <div className="flex items-center gap-6">
      <p className="hidden cursor-default select-none text-[14px] text-muted-foreground/60 sm:block">
        {currentUser?.name || currentUser?.email || 'User'}
      </p>
      {onSignOut && (
        <button
          type="button"
          className="text-[14px] text-muted-foreground/60 transition-colors hover:text-foreground"
          onClick={onSignOut}
        >
          Sign out
        </button>
      )}
    </div>
  );

  const leftAction = (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-[14px] text-muted-foreground/60 transition-colors hover:text-foreground"
      onClick={onBack}
    >
      <ArrowLeft size={16} strokeWidth={1.8} />
      Back
    </button>
  );

  return (
    <WorkspaceTemplate
      title={report?.title || 'Report Detail'}
      leftAction={leftAction}
      actions={actions}
      showHeader={false}
      wide
    >
      {isLoading ? (
        <div className="space-y-4 rounded-[22px] border border-black/[0.03] bg-white p-6">
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-black/[0.02]" />
          <div className="h-16 animate-pulse rounded-xl bg-black/[0.02]" />
          <div className="h-64 animate-pulse rounded-xl bg-black/[0.02]" />
        </div>
      ) : report ? (
        <ReportDetailView
          deletingItemId={deletingItemId}
          canSubmitReport={canSubmitReport}
          isSavingTitle={isSavingTitle}
          isSubmitting={isSubmitting}
          titleIsDirty={titleIsDirty}
          onChooseReceipt={onChooseReceipt}
          onReportTitleChange={onReportTitleChange}
          onReportTitleCommit={onReportTitleCommit}
          onReportTitleDiscard={onReportTitleDiscard}
          onDeleteItem={onDeleteItem}
          onOpenDrawer={onOpenDrawer}
          onReviewItem={onReviewItem}
          onSubmitReport={onSubmitReport}
          reportTitle={reportTitle}
          reportTitleError={reportTitleError}
          report={report}
          invalidItemCount={invalidItemCount}
        />
      ) : (
        <div className="rounded-[22px] border border-black/[0.03] bg-white px-6 py-20 text-center">
          <h1 className="text-[20px] font-medium tracking-tight">Report Not Found</h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground/60">
            The requested report could not be loaded. Please return to the dashboard and try again.
          </p>
        </div>
      )}

      <ReportReceiptDrawer
        draft={draft}
        initialDraft={savedDraft}
        drawer={drawer}
        isSavingReceipt={isSavingReceipt}
        isUploadingReceipt={isUploadingReceipt}
        onChooseReceipt={onChooseReceipt}
        onClose={onCloseDrawer}
        onDraftChange={onDraftChange}
        onRetryUpload={onRetryUpload}
        onSave={onSaveReceipt}
        pendingItemStatus={report?.items.find((item) => item.id === drawer.pendingItemId)?.aiStatus}
        reportStatus={report?.status ?? 'DRAFT'}
      />

      <ReportLeaveConfirmDialog
        open={leaveConfirmOpen}
        onCancel={onCancelLeaveConfirm}
        onConfirm={onConfirmLeaveConfirm}
      />
    </WorkspaceTemplate>
  );
}
