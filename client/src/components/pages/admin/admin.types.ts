import type { CurrentUserDto } from '@gradion/shared/auth';
import type { PaginationMetaDto } from '@gradion/shared/common';
import type { ExpenseItemDto } from '@gradion/shared/items';
import type { ExpenseReportDetailResponseDto } from '@gradion/shared/reports';

export interface AdminExpenseItemView extends ExpenseItemDto {
  extractionError?: string | null;
}

export interface AdminReportView extends Omit<
  ExpenseReportDetailResponseDto,
  'items' | 'currency' | 'itemCount'
> {
  items: AdminExpenseItemView[];
  totalAmount: number;
  currency?: string | null;
  itemCount?: number;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

export interface AdminDashboardPageProps {
  currentUser?: CurrentUserDto | null;
  reports: AdminReportView[];
  paginationMeta: PaginationMetaDto | null;
  isLoading: boolean;
  activeReportId: string | null;
  approvingReportId: string | null;
  rejectingReportId: string | null;
  onToggleReport: (reportId: string) => void;
  onApproveReport: (reportId: string) => void | Promise<void>;
  onRejectReport: (reportId: string) => void | Promise<void>;
  onPageChange: (page: number) => void;
  onSignOut?: () => void;
}
