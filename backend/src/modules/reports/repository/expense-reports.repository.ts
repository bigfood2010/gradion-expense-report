import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';
import type { PaginationQueryDto } from '@gradion/shared/common';

export interface ExpenseReportsListFilters {
  ownerId?: string;
  status?: ExpenseReportStatus | readonly ExpenseReportStatus[];
}

export interface ExpenseReportsPaginationFilters
  extends ExpenseReportsListFilters, PaginationQueryDto {}

export interface ExpenseReportsCursorFilters {
  ownerId?: string;
  status?: ExpenseReportStatus | readonly ExpenseReportStatus[];
  cursor?: string;
  limit?: number;
}

export interface ExpenseReportsListResult {
  items: ExpenseReportEntity[];
  totalItems: number;
}

export interface ExpenseReportsCursorResult {
  items: ExpenseReportEntity[];
  nextCursor: string | null;
  hasMore: boolean;
}

export abstract class ExpenseReportsRepository {
  abstract list(filters?: ExpenseReportsPaginationFilters): Promise<ExpenseReportsListResult>;

  abstract listWithCursor(
    filters?: ExpenseReportsCursorFilters,
  ): Promise<ExpenseReportsCursorResult>;

  abstract count(filters?: ExpenseReportsListFilters): Promise<number>;

  abstract findById(reportId: string): Promise<ExpenseReportEntity | null>;

  abstract findOwnedById(reportId: string, ownerId: string): Promise<ExpenseReportEntity | null>;

  abstract save(report: ExpenseReportEntity): Promise<ExpenseReportEntity>;

  abstract delete(report: ExpenseReportEntity): Promise<void>;
}
