import type {
  AmountRangeQueryDto,
  DateRangeQueryDto,
  PaginatedResponseDto,
  PaginationQueryDto,
  TextSearchQueryDto,
} from '@shared/common';
import type {
  CurrencyCode,
  IsoDateString,
  IsoDateTimeString,
  Uuid,
} from '@shared/common/primitives';
import type { ReportStatus, UserRole } from '@shared/enums';
import type { ExpenseReportDetailDto, ExpenseReportSummaryDto } from '@shared/reports/report.types';

export interface CreateExpenseReportRequestDto {
  title: string;
  description?: string | null;
  currency?: CurrencyCode;
}

export interface UpdateExpenseReportRequestDto {
  title?: string;
  description?: string | null;
}

export type SubmitExpenseReportRequestDto = Record<string, never>;

export interface ExpenseReportQueryDto
  extends PaginationQueryDto, TextSearchQueryDto, DateRangeQueryDto, AmountRangeQueryDto {
  userId?: Uuid;
  status?: ReportStatus;
  currency?: CurrencyCode;
  userRole?: UserRole;
}

export interface ExpenseReportDashboardSummaryDto {
  // Legacy fields (for backward compatibility)
  activeDrafts: number;
  pendingApproval: number;
  totalProcessed: number;
  // New detailed fields
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface ExpenseReportUserSummaryDto {
  id: Uuid;
  email: string;
  role: UserRole;
}

export type ExpenseReportDetailResponseDto = Omit<ExpenseReportDetailDto, 'user'> & {
  canEdit: boolean;
  submittedAt?: IsoDateTimeString | null;
  approvedAt?: IsoDateTimeString | null;
  rejectedAt?: IsoDateTimeString | null;
  user: ExpenseReportUserSummaryDto | null;
};

export type ExpenseReportResponseDto = ExpenseReportDetailResponseDto;

export type ExpenseReportListResponseDto = PaginatedResponseDto<ExpenseReportSummaryDto>;

export type ExpenseReportAdminListResponseDto =
  PaginatedResponseDto<ExpenseReportDetailResponseDto>;

export interface ExpenseReportCursorResponseDto {
  items: ExpenseReportSummaryDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type PaginatedExpenseReportResponseDto = ExpenseReportListResponseDto;
