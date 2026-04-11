import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, FindOptionsWhere, In, Repository } from 'typeorm';

import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import {
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
}
