import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CreateExpenseReportDto } from '@backend/modules/reports/dto/create-expense-report.dto';
import { ListExpenseReportsQueryDto } from '@backend/modules/reports/dto/list-expense-reports.query.dto';
import { UpdateExpenseReportDto } from '@backend/modules/reports/dto/update-expense-report.dto';
import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import { ExpenseReportsRepository } from '@backend/modules/reports/repository/expense-reports.repository';
import {
  mapExpenseReportDetailResponse,
  mapExpenseReportSummaryResponse,
} from '@backend/modules/reports/responses/expense-report.response';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';
import {
  DEFAULT_PAGE_SIZE,
  createPaginationMeta,
  normalizePagination,
  type PaginatedResponseDto,
} from '@gradion/shared/common';
import type {
  ExpenseReportAdminListResponseDto,
  ExpenseReportCursorResponseDto,
  ExpenseReportDashboardSummaryDto,
  ExpenseReportDetailResponseDto,
  ExpenseReportListResponseDto,
  ExpenseReportSummaryDto,
} from '@gradion/shared/reports';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ExpenseReportsRepository)
    private readonly expenseReportsRepository: ExpenseReportsRepository,
  ) {}

  async listOwnReports(
    ownerId: string,
    query: ListExpenseReportsQueryDto,
  ): Promise<ExpenseReportListResponseDto> {
    const pagination = normalizePagination(query, {
      defaultPageSize: DEFAULT_PAGE_SIZE,
      maxPageSize: DEFAULT_PAGE_SIZE,
    });
    const { items, totalItems } = await this.expenseReportsRepository.list({
      ownerId,
      ...(query.status !== undefined && { status: query.status }),
      ...pagination,
    });

    return this.buildPaginatedResponse<ExpenseReportSummaryDto>(
      items,
      totalItems,
      pagination.page,
      pagination.pageSize,
      mapExpenseReportSummaryResponse,
    );
  }

  async listOwnReportsWithCursor(
    ownerId: string,
    cursor?: string,
    limit = 50,
    status?: ExpenseReportStatus,
  ): Promise<ExpenseReportCursorResponseDto> {
    const filters: {
      ownerId: string;
      cursor?: string;
      limit: number;
      status?: ExpenseReportStatus;
    } = {
      ownerId,
      limit,
    };
    if (cursor) {
      filters.cursor = cursor;
    }
    if (status) {
      filters.status = status;
    }

    const { items, nextCursor, hasMore } =
      await this.expenseReportsRepository.listWithCursor(filters);

    return {
      items: items.map((report) => mapExpenseReportSummaryResponse(report)),
      nextCursor,
      hasMore,
    };
  }

  async createOwnReport(
    ownerId: string,
    dto: CreateExpenseReportDto,
  ): Promise<ExpenseReportDetailResponseDto> {
    const report = new ExpenseReportEntity();
    report.userId = ownerId;
    report.title = dto.title;
    report.description = dto.description ?? null;
    report.status = ExpenseReportStatus.DRAFT;
    report.items = [];
    report.submittedAt = null;
    report.approvedAt = null;
    report.rejectedAt = null;

    const savedReport = await this.expenseReportsRepository.save(report);
    return mapExpenseReportDetailResponse(savedReport);
  }

  async getOwnReport(ownerId: string, reportId: string): Promise<ExpenseReportDetailResponseDto> {
    const report = await this.getOwnedReportOrThrow(reportId, ownerId);
    return mapExpenseReportDetailResponse(report);
  }

  async updateOwnReport(
    ownerId: string,
    reportId: string,
    dto: UpdateExpenseReportDto,
  ): Promise<ExpenseReportDetailResponseDto> {
    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException('At least one report field must be provided.');
    }

    const report = await this.getOwnedReportOrThrow(reportId, ownerId);
    this.assertReportCanBeEdited(report);

    if (dto.title !== undefined) {
      report.title = dto.title;
    }

    if (dto.description !== undefined) {
      report.description = dto.description ?? null;
    }

    this.reopenRejectedReport(report);

    const savedReport = await this.expenseReportsRepository.save(report);
    return mapExpenseReportDetailResponse(savedReport);
  }

  async deleteOwnReport(ownerId: string, reportId: string): Promise<void> {
    const report = await this.getOwnedReportOrThrow(reportId, ownerId);

    if (report.status !== ExpenseReportStatus.DRAFT) {
      throw new BadRequestException('Only draft reports can be deleted.');
    }

    await this.expenseReportsRepository.delete(report);
  }

  async submitOwnReport(
    ownerId: string,
    reportId: string,
  ): Promise<ExpenseReportDetailResponseDto> {
    const report = await this.getOwnedReportOrThrow(reportId, ownerId);

    if (
      report.status !== ExpenseReportStatus.DRAFT &&
      report.status !== ExpenseReportStatus.REJECTED
    ) {
      throw new BadRequestException('Only draft or rejected reports can be submitted.');
    }

    if ((report.items?.length ?? 0) === 0) {
      throw new BadRequestException('A report must contain at least one item before submission.');
    }

    const invalidItems =
      report.items?.filter((item) => parseFloat(String(item.amount ?? 0)) <= 0) ?? [];
    if (invalidItems.length > 0) {
      throw new BadRequestException(
        `${invalidItems.length} item(s) have invalid amounts. All items must have an amount greater than zero before submission.`,
      );
    }

    report.status = ExpenseReportStatus.SUBMITTED;
    report.submittedAt = new Date();
    report.approvedAt = null;
    report.rejectedAt = null;

    const savedReport = await this.expenseReportsRepository.save(report);
    return mapExpenseReportDetailResponse(savedReport);
  }

  async getOwnDashboardSummary(ownerId: string): Promise<ExpenseReportDashboardSummaryDto> {
    const [draftCount, submittedCount, approvedCount, rejectedCount] = await Promise.all([
      this.expenseReportsRepository.count({
        ownerId,
        status: ExpenseReportStatus.DRAFT,
      }),
      this.expenseReportsRepository.count({
        ownerId,
        status: ExpenseReportStatus.SUBMITTED,
      }),
      this.expenseReportsRepository.count({
        ownerId,
        status: ExpenseReportStatus.APPROVED,
      }),
      this.expenseReportsRepository.count({
        ownerId,
        status: ExpenseReportStatus.REJECTED,
      }),
    ]);

    return {
      // Legacy fields
      activeDrafts: draftCount,
      pendingApproval: submittedCount,
      totalProcessed: approvedCount + rejectedCount,
      // New detailed fields
      draftCount,
      submittedCount,
      approvedCount,
      rejectedCount,
    };
  }

  async listAllReports(
    query: ListExpenseReportsQueryDto,
  ): Promise<ExpenseReportAdminListResponseDto> {
    const pagination = normalizePagination(query, {
      defaultPageSize: DEFAULT_PAGE_SIZE,
      maxPageSize: DEFAULT_PAGE_SIZE,
    });
    const { items, totalItems } = await this.expenseReportsRepository.list({
      ...(query.status !== undefined && { status: query.status }),
      ...pagination,
    });

    return this.buildPaginatedResponse(
      items,
      totalItems,
      pagination.page,
      pagination.pageSize,
      mapExpenseReportDetailResponse,
    );
  }

  async listAllReportsWithCursor(
    cursor?: string,
    limit = 50,
    status?: ExpenseReportStatus,
  ): Promise<ExpenseReportCursorResponseDto> {
    const filters: { cursor?: string; limit: number; status?: ExpenseReportStatus } = {
      limit,
    };
    if (cursor) {
      filters.cursor = cursor;
    }
    if (status) {
      filters.status = status;
    }

    const { items, nextCursor, hasMore } =
      await this.expenseReportsRepository.listWithCursor(filters);

    return {
      items: items.map((report) => mapExpenseReportSummaryResponse(report)),
      nextCursor,
      hasMore,
    };
  }

  async approveReport(reportId: string): Promise<ExpenseReportDetailResponseDto> {
    const report = await this.getReportOrThrow(reportId);

    if (report.status !== ExpenseReportStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be approved.');
    }

    report.status = ExpenseReportStatus.APPROVED;
    report.approvedAt = new Date();
    report.rejectedAt = null;

    const savedReport = await this.expenseReportsRepository.save(report);
    return mapExpenseReportDetailResponse(savedReport);
  }

  async rejectReport(reportId: string): Promise<ExpenseReportDetailResponseDto> {
    const report = await this.getReportOrThrow(reportId);

    if (report.status !== ExpenseReportStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be rejected.');
    }

    report.status = ExpenseReportStatus.REJECTED;
    report.rejectedAt = new Date();
    report.approvedAt = null;

    const savedReport = await this.expenseReportsRepository.save(report);
    return mapExpenseReportDetailResponse(savedReport);
  }

  private async getOwnedReportOrThrow(
    reportId: string,
    ownerId: string,
  ): Promise<ExpenseReportEntity> {
    const report = await this.expenseReportsRepository.findOwnedById(reportId, ownerId);

    if (!report) {
      throw new NotFoundException('Expense report not found.');
    }

    return report;
  }

  private async getReportOrThrow(reportId: string): Promise<ExpenseReportEntity> {
    const report = await this.expenseReportsRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException('Expense report not found.');
    }

    return report;
  }

  private assertReportCanBeEdited(report: ExpenseReportEntity): void {
    if (
      report.status !== ExpenseReportStatus.DRAFT &&
      report.status !== ExpenseReportStatus.REJECTED
    ) {
      throw new BadRequestException('This report is locked and cannot be edited.');
    }
  }

  private reopenRejectedReport(report: ExpenseReportEntity): void {
    if (report.status === ExpenseReportStatus.REJECTED) {
      report.status = ExpenseReportStatus.DRAFT;
      report.rejectedAt = null;
      report.submittedAt = null;
      report.approvedAt = null;
    }
  }

  private buildPaginatedResponse<TOutput>(
    reports: ExpenseReportEntity[],
    totalItems: number,
    page: number,
    pageSize: number,
    mapReport: (report: ExpenseReportEntity) => TOutput,
  ): PaginatedResponseDto<TOutput> {
    const meta = createPaginationMeta(totalItems, page, pageSize);

    return {
      items: reports.map((report) => mapReport(report)),
      meta,
    };
  }
}
