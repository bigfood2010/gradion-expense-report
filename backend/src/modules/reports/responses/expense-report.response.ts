import type { ExpenseReportDetailDto, ExpenseReportSummaryDto } from '@gradion/shared/reports';

import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';
import { UserRole } from '@backend/modules/users/domain/user-role.enum';

export interface ExpenseReportUserSummaryResponse {
  id: string;
  email: string;
  role: UserRole;
}

export interface ExpenseReportDetailResponse extends Omit<ExpenseReportDetailDto, 'user'> {
  canEdit: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  user: ExpenseReportUserSummaryResponse | null;
}

function toMoneyValue(value: string | number): number {
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildReportTotals(report: ExpenseReportEntity) {
  const items = report.items ?? [];

  return {
    totalAmount: roundCurrency(
      items.reduce((sum, item) => sum + toMoneyValue(item.amount ?? 0), 0),
    ),
    itemCount: items.length,
    currency: report.currency,
    canEdit:
      report.status === ExpenseReportStatus.DRAFT || report.status === ExpenseReportStatus.REJECTED,
  };
}

export function mapExpenseReportSummaryResponse(
  report: ExpenseReportEntity,
  totals?: ReturnType<typeof buildReportTotals>,
): ExpenseReportSummaryDto {
  const { totalAmount, currency, itemCount } = totals ?? buildReportTotals(report);

  return {
    id: report.id,
    userId: report.userId,
    title: report.title,
    status: report.status,
    totalAmount,
    currency,
    itemCount,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function mapExpenseReportDetailResponse(
  report: ExpenseReportEntity,
): ExpenseReportDetailResponse {
  const totals = buildReportTotals(report);

  return {
    ...mapExpenseReportSummaryResponse(report, totals),
    description: report.description ?? null,
    canEdit: totals.canEdit,
    submittedAt: report.submittedAt?.toISOString() ?? null,
    approvedAt: report.approvedAt?.toISOString() ?? null,
    rejectedAt: report.rejectedAt?.toISOString() ?? null,
    user: report.user
      ? {
          id: report.user.id,
          email: report.user.email,
          role: report.user.role,
        }
      : null,
    items: (report.items ?? []).map((item) => ({
      id: item.id,
      reportId: item.reportId,
      merchant: item.merchant,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      date: item.date,
      receiptUrl: item.receiptUrl,
      receiptOriginalName: item.receiptOriginalName ?? null,
      aiStatus: item.aiStatus,
      aiExtracted: item.aiExtracted,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}
