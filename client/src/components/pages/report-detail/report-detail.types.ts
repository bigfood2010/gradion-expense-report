import type { CurrentUserDto } from '@gradion/shared/auth';
import type { AIStatus, ReportStatus } from '@gradion/shared/enums';
import type { ExpenseItemDto } from '@gradion/shared/items';
import type { ExpenseReportDetailResponseDto } from '@gradion/shared/reports';

export interface ReportExpenseItem extends ExpenseItemDto {
  extractionError?: string | null;
}

export interface ReportDetailView extends Omit<
  ExpenseReportDetailResponseDto,
  'items' | 'currency' | 'itemCount' | 'user' | 'canEdit'
> {
  items: ReportExpenseItem[];
  totalAmount: number;
  currency?: string | null;
  itemCount?: number;
  canEdit?: boolean;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

export interface ReceiptDraft {
  merchant: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  receiptUrl: string | null;
  aiExtractedFields: Partial<Record<ReceiptDraftField, true>>;
}

export type ReceiptDraftField = 'merchant' | 'description' | 'amount' | 'currency' | 'date';

export type ReceiptDrawerStep = 'upload' | 'processing' | 'review' | 'failed';

export interface ReceiptDrawerState {
  open: boolean;
  step: ReceiptDrawerStep;
  fileName: string | null;
  pendingItemId: string | null;
  error: string | null;
}

export interface ReportDetailPageProps {
  currentUser?: CurrentUserDto | null;
  report: ReportDetailView | null;
  isLoading: boolean;
  isSavingTitle: boolean;
  isSubmitting: boolean;
  isUploadingReceipt: boolean;
  isSavingReceipt: boolean;
  canSubmitReport: boolean;
  invalidItemCount: number;
  titleIsDirty: boolean;
  deletingItemId: string | null;
  drawer: ReceiptDrawerState;
  draft: ReceiptDraft;
  savedDraft?: ReceiptDraft;
  reportTitle: string;
  reportTitleError: string | null;
  leaveConfirmOpen: boolean;
  onBack: () => void;
  onCancelLeaveConfirm: () => void;
  onConfirmLeaveConfirm: () => void;
  onSignOut?: () => void;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
  onChooseReceipt: (file: File) => void;
  onRetryUpload: () => void;
  onDraftChange: (patch: Partial<ReceiptDraft>) => void;
  onReportTitleChange: (value: string) => void;
  onReportTitleCommit: () => void | Promise<void>;
  onReportTitleDiscard: () => void;
  onSaveReceipt: () => void | Promise<void>;
  onSubmitReport: () => void | Promise<void>;
  onDeleteItem: (itemId: string) => void | Promise<void>;
  onReviewItem: (item: ReportExpenseItem) => void;
}

export interface ReportDetailOrganismProps {
  report: ReportDetailView;
  reportTitle: string;
  reportTitleError: string | null;
  isSavingTitle: boolean;
  canSubmitReport: boolean;
  invalidItemCount: number;
  titleIsDirty: boolean;
  isSubmitting: boolean;
  deletingItemId: string | null;
  onOpenDrawer: () => void;
  onChooseReceipt: (file: File) => void;
  onReportTitleChange: (value: string) => void;
  onReportTitleCommit: () => void | Promise<void>;
  onReportTitleDiscard: () => void;
  onSubmitReport: () => void | Promise<void>;
  onDeleteItem: (itemId: string) => void | Promise<void>;
  onReviewItem: (item: ReportExpenseItem) => void;
}

export interface ReportReceiptDrawerProps {
  drawer: ReceiptDrawerState;
  draft: ReceiptDraft;
  initialDraft?: ReceiptDraft;
  isUploadingReceipt: boolean;
  isSavingReceipt: boolean;
  reportStatus: ReportStatus;
  pendingItemStatus?: AIStatus;
  onClose: () => void;
  onChooseReceipt: (file: File) => void;
  onRetryUpload: () => void;
  onDraftChange: (patch: Partial<ReceiptDraft>) => void;
  onSave: () => void | Promise<void>;
}

export interface ReportLeaveConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
