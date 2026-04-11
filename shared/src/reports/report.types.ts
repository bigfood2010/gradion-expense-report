import type { AuthUserDto } from '@shared/auth';
import type { CurrencyCode, IsoDateTimeString, Uuid } from '@shared/common/primitives';
import type { ReportStatus } from '@shared/enums';
import type { ExpenseItemDto } from '@shared/items';

export interface ExpenseReportSummaryDto {
  id: Uuid;
  userId: Uuid;
  title: string;
  status: ReportStatus;
  totalAmount: number;
  currency: CurrencyCode;
  itemCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface ExpenseReportDto extends ExpenseReportSummaryDto {
  user?: AuthUserDto;
}

export interface ExpenseReportDetailDto extends ExpenseReportDto {
  description?: string | null;
  items: ExpenseItemDto[];
}

export interface ReportStateChangeDto {
  reportId: Uuid;
  previousStatus: ReportStatus;
  nextStatus: ReportStatus;
  changedAt: IsoDateTimeString;
}
