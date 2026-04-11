import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UpdateExpenseReportDto } from '@backend/modules/reports/dto/update-expense-report.dto';
import { ExpenseItemReferenceEntity } from '@backend/modules/reports/entities/expense-item-reference.entity';
import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import {
  ExpenseReportsListFilters,
  ExpenseReportsListResult,
  ExpenseReportsPaginationFilters,
  ExpenseReportsRepository,
} from '@backend/modules/reports/repository/expense-reports.repository';
import { ReportsService } from '@backend/modules/reports/reports.service';
import {
  ExpenseItemAIStatus,
  ExpenseReportStatus,
} from '@backend/modules/reports/reports.types';
import { UserRole } from '@backend/modules/users/domain/user-role.enum';
import { DEFAULT_PAGE_SIZE, normalizePagination } from '@gradion/shared/common';

class InMemoryExpenseReportsRepository extends ExpenseReportsRepository {
  constructor(private readonly reports: ExpenseReportEntity[]) {
    super();
  }

  async list(filters: ExpenseReportsPaginationFilters = {}): Promise<ExpenseReportsListResult> {
    const matchedReports = this.reports.filter((report) => matchesFilters(report, filters));
    const pagination = normalizePagination(filters, {
      defaultPageSize: DEFAULT_PAGE_SIZE,
      maxPageSize: DEFAULT_PAGE_SIZE,
    });

    return {
      items: matchedReports.slice(pagination.skip, pagination.skip + pagination.take),
      totalItems: matchedReports.length,
    };
  }

  async count(filters: ExpenseReportsListFilters = {}): Promise<number> {
    return this.reports.filter((report) => matchesFilters(report, filters)).length;
  }

  async findById(reportId: string): Promise<ExpenseReportEntity | null> {
    return this.reports.find((report) => report.id === reportId) ?? null;
  }

  async findOwnedById(reportId: string, ownerId: string): Promise<ExpenseReportEntity | null> {
    return (
      this.reports.find((report) => report.id === reportId && report.userId === ownerId) ?? null
    );
  }

  async save(report: ExpenseReportEntity): Promise<ExpenseReportEntity> {
    const index = this.reports.findIndex((currentReport) => currentReport.id === report.id);

    if (index === -1) {
      report.createdAt ??= new Date('2026-04-10T00:00:00.000Z');
      report.updatedAt = new Date('2026-04-10T00:00:00.000Z');
      this.reports.push(report);
      return report;
    }

    report.updatedAt = new Date('2026-04-10T00:00:00.000Z');
    this.reports[index] = report;
    return report;
  }

  async delete(report: ExpenseReportEntity): Promise<void> {
    const index = this.reports.findIndex((currentReport) => currentReport.id === report.id);

    if (index !== -1) {
      this.reports.splice(index, 1);
    }
  }
}

function matchesFilters(report: ExpenseReportEntity, filters: ExpenseReportsListFilters): boolean {
  if (filters.ownerId && report.userId !== filters.ownerId) {
    return false;
  }

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];

    if (!statuses.includes(report.status)) {
      return false;
    }
  }

  return true;
}

function makeItem(overrides: Partial<ExpenseItemReferenceEntity> = {}): ExpenseItemReferenceEntity {
  return {
    id: 'item-1',
    reportId: 'report-1',
    amount: '42.50',
    currency: 'USD',
    aiStatus: ExpenseItemAIStatus.COMPLETED,
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    ...overrides,
  } as ExpenseItemReferenceEntity;
}

function makeReport(overrides: Partial<ExpenseReportEntity> = {}): ExpenseReportEntity {
  return {
    id: 'report-1',
    userId: 'user-1',
    title: 'April Expenses',
    description: null,
    status: ExpenseReportStatus.DRAFT,
    items: [],
    submittedAt: null,
    approvedAt: null,
    rejectedAt: null,
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    user: {
      id: 'user-1',
      email: 'user@example.com',
      role: UserRole.USER,
    },
    ...overrides,
  } as ExpenseReportEntity;
}

describe('ReportsService', () => {
  it('reopens a rejected report as draft when the owner edits it', async () => {
    const report = makeReport({
      status: ExpenseReportStatus.REJECTED,
      rejectedAt: new Date('2026-04-09T00:00:00.000Z'),
    });
    const repository = new InMemoryExpenseReportsRepository([report]);
    const service = new ReportsService(repository);

    const response = await service.updateOwnReport('user-1', 'report-1', {
      title: 'Updated Title',
    } satisfies UpdateExpenseReportDto);

    expect(response.title).toBe('Updated Title');
    expect(response.status).toBe(ExpenseReportStatus.DRAFT);
    expect(response.rejectedAt).toBeNull();
  });

  it('rejects submission when the draft has no items', async () => {
    const repository = new InMemoryExpenseReportsRepository([makeReport()]);
    const service = new ReportsService(repository);

    await expect(service.submitOwnReport('user-1', 'report-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows admin approval only from submitted state', async () => {
    const report = makeReport({
      status: ExpenseReportStatus.SUBMITTED,
      items: [makeItem()],
      submittedAt: new Date('2026-04-10T01:00:00.000Z'),
    });
    const repository = new InMemoryExpenseReportsRepository([report]);
    const service = new ReportsService(repository);

    const response = await service.approveReport('report-1');

    expect(response.status).toBe(ExpenseReportStatus.APPROVED);
    expect(response.approvedAt).not.toBeNull();
  });

  it('paginates own reports at 20 items per page', async () => {
    const repository = new InMemoryExpenseReportsRepository(
      Array.from({ length: 25 }, (_, index) =>
        makeReport({
          id: `report-${index + 1}`,
          title: `Report ${index + 1}`,
          createdAt: new Date(`2026-04-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`),
          updatedAt: new Date(`2026-04-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`),
        }),
      ),
    );
    const service = new ReportsService(repository);

    const response = await service.listOwnReports('user-1', {
      page: 2,
      pageSize: 20,
    } satisfies ExpenseReportsPaginationFilters);

    expect(response.items).toHaveLength(5);
    expect(response.meta).toMatchObject({
      page: 2,
      pageSize: 20,
      totalItems: 25,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(response.items[0]?.id).toBe('report-21');
  });

  it('returns dashboard summary counts for the owner only', async () => {
    const repository = new InMemoryExpenseReportsRepository([
      makeReport({ id: 'draft-1', status: ExpenseReportStatus.DRAFT }),
      makeReport({ id: 'draft-2', status: ExpenseReportStatus.DRAFT }),
      makeReport({ id: 'submitted-1', status: ExpenseReportStatus.SUBMITTED }),
      makeReport({ id: 'submitted-2', status: ExpenseReportStatus.SUBMITTED }),
      makeReport({ id: 'approved-1', status: ExpenseReportStatus.APPROVED }),
      makeReport({ id: 'rejected-1', status: ExpenseReportStatus.REJECTED }),
      makeReport({ id: 'other-user', userId: 'user-2', status: ExpenseReportStatus.DRAFT }),
    ]);
    const service = new ReportsService(repository);

    await expect(service.getOwnDashboardSummary('user-1')).resolves.toEqual({
      activeDrafts: 2,
      pendingApproval: 2,
      totalProcessed: 2,
    });
  });

  it('refuses to delete non-draft reports', async () => {
    const repository = new InMemoryExpenseReportsRepository([
      makeReport({ status: ExpenseReportStatus.SUBMITTED }),
    ]);
    const service = new ReportsService(repository);

    await expect(service.deleteOwnReport('user-1', 'report-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when an owner requests a report that does not exist', async () => {
    const repository = new InMemoryExpenseReportsRepository([]);
    const service = new ReportsService(repository);

    await expect(
      service.updateOwnReport('user-1', 'missing-report', { title: 'Still Missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
