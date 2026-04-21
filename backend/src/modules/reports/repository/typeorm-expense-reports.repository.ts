import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm';

import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import {
  ExpenseReportsCursorFilters,
  ExpenseReportsCursorResult,
  ExpenseReportsListFilters,
  ExpenseReportsListResult,
  ExpenseReportsRepository,
  ExpenseReportsPaginationFilters,
} from '@backend/modules/reports/repository/expense-reports.repository';
import { DEFAULT_PAGE_SIZE, normalizePagination } from '@gradion/shared/common';

@Injectable()
export class TypeOrmExpenseReportsRepository extends ExpenseReportsRepository {
  constructor(
    @InjectRepository(ExpenseReportEntity)
    private readonly expenseReportsRepository: Repository<ExpenseReportEntity>,
  ) {
    super();
  }

  async list(filters: ExpenseReportsPaginationFilters = {}): Promise<ExpenseReportsListResult> {
    const where: FindOptionsWhere<ExpenseReportEntity> = {};

    if (filters.ownerId) {
      where.userId = filters.ownerId;
    }

    const statusFilter = this.buildStatusFilter(filters.status);
    if (statusFilter) {
      where.status = statusFilter;
    }

    const pagination = normalizePagination(filters, {
      defaultPageSize: DEFAULT_PAGE_SIZE,
      maxPageSize: DEFAULT_PAGE_SIZE,
    });

    const [items, totalItems] = await this.expenseReportsRepository.findAndCount({
      where,
      relations: {
        items: true,
        user: true,
      },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    return { items, totalItems };
  }

  async count(filters: ExpenseReportsListFilters = {}): Promise<number> {
    const where: FindOptionsWhere<ExpenseReportEntity> = {};

    if (filters.ownerId) {
      where.userId = filters.ownerId;
    }

    const statusFilter = this.buildStatusFilter(filters.status);
    if (statusFilter) {
      where.status = statusFilter;
    }

    return this.expenseReportsRepository.count({
      where,
    });
  }

  async listWithCursor(
    filters: ExpenseReportsCursorFilters = {},
  ): Promise<ExpenseReportsCursorResult> {
    const limit = filters.limit ?? 50;
    const cursor = filters.cursor;
    const queryBuilder = this.expenseReportsRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.items', 'items')
      .leftJoinAndSelect('report.user', 'user');
    this.applyCursorFilters(queryBuilder, filters);

    if (cursor) {
      const cursorQueryBuilder = this.expenseReportsRepository
        .createQueryBuilder('report')
        .select(['report.id', 'report.createdAt'])
        .where('report.id = :cursor', { cursor });
      this.applyCursorFilters(cursorQueryBuilder, filters);

      const cursorReport = await cursorQueryBuilder.getOne();
      if (cursorReport) {
        queryBuilder.andWhere(
          '(report.createdAt < :cursorCreatedAt OR (report.createdAt = :cursorCreatedAt AND report.id < :cursorId))',
          {
            cursorCreatedAt: cursorReport.createdAt,
            cursorId: cursorReport.id,
          },
        );
      } else {
        return { items: [], nextCursor: null, hasMore: false };
      }
    }

    const items = await queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .addOrderBy('report.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (resultItems[resultItems.length - 1]?.id ?? null) : null;

    return {
      items: resultItems,
      nextCursor,
      hasMore,
    };
  }

  async findById(reportId: string): Promise<ExpenseReportEntity | null> {
    return this.expenseReportsRepository.findOne({
      where: { id: reportId },
      relations: {
        items: true,
        user: true,
      },
    });
  }

  async findOwnedById(reportId: string, ownerId: string): Promise<ExpenseReportEntity | null> {
    return this.expenseReportsRepository.findOne({
      where: {
        id: reportId,
        userId: ownerId,
      },
      relations: {
        items: true,
        user: true,
      },
    });
  }

  async save(report: ExpenseReportEntity): Promise<ExpenseReportEntity> {
    return this.expenseReportsRepository.save(report);
  }

  async delete(report: ExpenseReportEntity): Promise<void> {
    await this.expenseReportsRepository.remove(report);
  }

  private buildStatusFilter(
    status?: ExpenseReportsListFilters['status'],
  ): ExpenseReportEntity['status'] | FindOperator<ExpenseReportEntity['status']> | null {
    if (!status) {
      return null;
    }

    if (Array.isArray(status)) {
      return In([...status]) as FindOperator<ExpenseReportEntity['status']>;
    }

    return status as ExpenseReportEntity['status'];
  }

  private applyCursorFilters(
    queryBuilder: SelectQueryBuilder<ExpenseReportEntity>,
    filters: ExpenseReportsCursorFilters,
  ): void {
    if (filters.ownerId) {
      queryBuilder.andWhere('report.userId = :ownerId', { ownerId: filters.ownerId });
    }

    if (!filters.status) {
      return;
    }

    if (Array.isArray(filters.status)) {
      queryBuilder.andWhere('report.status IN (:...statuses)', { statuses: [...filters.status] });
      return;
    }

    queryBuilder.andWhere('report.status = :status', { status: filters.status });
  }
}
